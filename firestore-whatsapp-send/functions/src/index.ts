import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { sendWhatsAppMessage, MessagePayload } from "./whatsapp";

admin.initializeApp();

const db = admin.firestore();

// ─── Config from extension params ────────────────────────────────────────────

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_TOKEN = process.env.WHATSAPP_API_TOKEN!;
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!;
const COLLECTION_PATH = process.env.COLLECTION_PATH!;
const TO_FIELD = process.env.TO_FIELD || "to";
const MESSAGE_TYPE_FIELD = process.env.MESSAGE_TYPE_FIELD || "type";
const MESSAGE_FIELD = process.env.MESSAGE_FIELD || "message";
const TEMPLATE_NAME_FIELD = process.env.TEMPLATE_NAME_FIELD || "template_name";
const TEMPLATE_LANGUAGE_FIELD =
  process.env.TEMPLATE_LANGUAGE_FIELD || "template_language";
const TEMPLATE_PARAMS_FIELD =
  process.env.TEMPLATE_PARAMS_FIELD || "template_params";
const STATUS_FIELD = process.env.STATUS_FIELD || "status";

// ─── Helper: update document status ──────────────────────────────────────────

async function updateDocStatus(
  docPath: string,
  update: Record<string, unknown>,
): Promise<void> {
  try {
    await db.doc(docPath).update({
      [STATUS_FIELD]: update.status,
      ...update,
      [`${STATUS_FIELD}_updated_at`]:
        admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error(`[whatsapp] Failed to update doc status at ${docPath}`, err);
  }
}

// ─── Function 1: Firestore trigger → send message ────────────────────────────

export const sendWhatsAppMessageFn = onDocumentCreated(
  {
    document: `${COLLECTION_PATH}/{documentId}`,
    region: process.env.LOCATION || "us-central1",
    secrets: ["WHATSAPP_API_TOKEN", "WEBHOOK_VERIFY_TOKEN"],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("[whatsapp] No snapshot data, skipping.");
      return;
    }

    const docPath = snapshot.ref.path;
    const data = snapshot.data();

    // Skip if already processed
    const currentStatus = data[STATUS_FIELD];
    if (currentStatus && currentStatus !== "pending") {
      logger.info(
        `[whatsapp] Doc ${docPath} already has status "${currentStatus}", skipping.`,
      );
      return;
    }

    const to: string = data[TO_FIELD];
    const type: string = data[MESSAGE_TYPE_FIELD] || "text";

    if (!to) {
      logger.error(`[whatsapp] Missing "${TO_FIELD}" field in doc ${docPath}`);
      await updateDocStatus(docPath, {
        status: "error",
        error: `Missing required field: ${TO_FIELD}`,
      });
      return;
    }

    let payload: MessagePayload;

    if (type === "template") {
      const templateName: string = data[TEMPLATE_NAME_FIELD];
      if (!templateName) {
        logger.error(
          `[whatsapp] Missing "${TEMPLATE_NAME_FIELD}" in doc ${docPath}`,
        );
        await updateDocStatus(docPath, {
          status: "error",
          error: `Missing required field: ${TEMPLATE_NAME_FIELD}`,
        });
        return;
      }
      payload = {
        type: "template",
        to,
        templateName,
        templateLanguage: data[TEMPLATE_LANGUAGE_FIELD] || "en",
        templateParams: data[TEMPLATE_PARAMS_FIELD] || [],
      };
    } else {
      const message: string = data[MESSAGE_FIELD];
      if (!message) {
        logger.error(`[whatsapp] Missing "${MESSAGE_FIELD}" in doc ${docPath}`);
        await updateDocStatus(docPath, {
          status: "error",
          error: `Missing required field: ${MESSAGE_FIELD}`,
        });
        return;
      }
      payload = { type: "text", to, message };
    }

    try {
      await updateDocStatus(docPath, { status: "processing" });

      const result = await sendWhatsAppMessage(
        PHONE_NUMBER_ID,
        API_TOKEN,
        payload,
      );

      logger.info(
        `[whatsapp] Message sent: ${result.messageId} for doc ${docPath}`,
      );

      await updateDocStatus(docPath, {
        status: "sent",
        whatsapp_message_id: result.messageId,
        sent_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(
        `[whatsapp] Failed to send message for doc ${docPath}:`,
        errorMessage,
      );
      await updateDocStatus(docPath, {
        status: "error",
        error: errorMessage,
      });
    }
  },
);

// ─── Function 2: Webhook receiver (delivery status updates) ──────────────────

export const whatsappWebhookFn = onRequest(
  {
    region: process.env.LOCATION || "us-central1",
    secrets: ["WHATSAPP_API_TOKEN", "WEBHOOK_VERIFY_TOKEN"],
  },
  async (req, res) => {
    // GET: webhook verification handshake from Meta
    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        logger.info("[whatsapp] Webhook verified successfully.");
        res.status(200).send(challenge);
      } else {
        logger.warn("[whatsapp] Webhook verification failed — token mismatch.");
        res.status(403).send("Forbidden");
      }
      return;
    }

    // POST: incoming status update from Meta
    if (req.method === "POST") {
      try {
        const body = req.body;

        // Validate this is from our WABA
        if (body?.entry?.[0]?.id !== WABA_ID) {
          logger.warn("[whatsapp] Webhook payload WABA ID mismatch, ignoring.");
          res.status(200).send("OK"); // Always 200 to Meta
          return;
        }

        const changes = body?.entry?.[0]?.changes || [];

        for (const change of changes) {
          const statuses = change?.value?.statuses || [];

          for (const statusUpdate of statuses) {
            const messageId: string = statusUpdate.id;
            const newStatus: string = statusUpdate.status; // sent, delivered, read, failed

            if (!messageId || !newStatus) continue;

            logger.info(
              `[whatsapp] Status update: ${messageId} → ${newStatus}`,
            );

            // Find the Firestore doc with this whatsapp_message_id
            const query = await db
              .collectionGroup(
                COLLECTION_PATH.split("/").pop() || COLLECTION_PATH,
              )
              .where("whatsapp_message_id", "==", messageId)
              .limit(1)
              .get();

            if (!query.empty) {
              const docRef = query.docs[0].ref;
              await docRef.update({
                [STATUS_FIELD]: newStatus,
                [`${STATUS_FIELD}_updated_at`]:
                  admin.firestore.FieldValue.serverTimestamp(),
                ...(newStatus === "delivered" && {
                  delivered_at: admin.firestore.FieldValue.serverTimestamp(),
                }),
                ...(newStatus === "read" && {
                  read_at: admin.firestore.FieldValue.serverTimestamp(),
                }),
                ...(newStatus === "failed" && {
                  error: statusUpdate.errors?.[0]?.message || "Delivery failed",
                }),
              });
              logger.info(
                `[whatsapp] Updated doc ${docRef.path} to status "${newStatus}"`,
              );
            } else {
              logger.warn(
                `[whatsapp] No doc found for whatsapp_message_id: ${messageId}`,
              );
            }
          }
        }

        res.status(200).send("OK");
      } catch (err) {
        logger.error("[whatsapp] Webhook processing error:", err);
        res.status(200).send("OK"); // Always 200 to Meta even on internal errors
      }
      return;
    }

    res.status(405).send("Method Not Allowed");
  },
);
