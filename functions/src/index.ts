import * as functions from "firebase-functions";
import * as logs from "./utils/logs.js";
import {
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import config, { StatusType } from "./utils/config.js";

const {
  apiKey,
  promptField,
  responseField,
  collectionName,
  parentMessageIdField,
} = config;

// Generate `completionParams`
const completionParams = logs.initialize(config);

// ChatGPT API Initialization
const chatgpt = new ChatGPTAPI({ apiKey, completionParams });

/**
 * This is triggered whenever a document in the specified ${param:COLLECTION_NAME} is written.
 * Generates an AI response based on the new or updated document containing user prompt
 *
 * @function generateAIResponse
 * @fires functions.firestore.document().onWrite
 * @param {functions.Change<DocumentSnapshot>} change - The change that occurred. Contains
 * information about the document before and after the write.
 * @returns {Promise<void>}
 */
export const generateAIResponse = functions.firestore
  .document(collectionName)
  .onWrite(
    async (change: functions.Change<DocumentSnapshot>): Promise<void> => {
      if (!change.after.exists) {
        return;
      }

      const newPrompt = await change.after.get(promptField);
      const apiCallState = change.after.get("status.state");

      // Exit on invalid prompt and various status
      if (
        !newPrompt ||
        typeof newPrompt !== "string" ||
        Object.keys(StatusType).includes(apiCallState)
      ) {
        return;
      }

      const ref: DocumentReference = change.after.ref;
      const prevParentMsgId = await change.after.get(parentMessageIdField);

      // Initial processing status
      await ref.update({
        status: {
          state: StatusType.PROCESSING,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
      });

      try {
        const logStartTime = performance.now();

        // Send message to ChatGPT
        const response: ChatMessage = await chatgpt.sendMessage(newPrompt, {
          ...(prevParentMsgId
            ? { [parentMessageIdField]: prevParentMsgId }
            : {}),
        });

        // Log API performance
        const duration = performance.now() - logStartTime;
        logs.receivedAPIResponse(ref.path, duration);

        const { text, parentMessageId } = response;

        // Write response to Firestore Doc
        ref.update({
          [responseField]: text,
          [parentMessageIdField]: parentMessageId,
          "status.state": StatusType.COMPLETED,
          "status.updated_at": FieldValue.serverTimestamp(),
        });
      } catch (err) {
        logs.errorCallingChatGPTAPI(err);

        // Update on API call error
        ref.update({
          "status.state": StatusType.ERRORED,
          "status.updated_at": FieldValue.serverTimestamp(),
        });
      }

      return;
    }
  );
