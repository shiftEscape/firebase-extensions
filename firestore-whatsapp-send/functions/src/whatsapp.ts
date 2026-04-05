import axios from "axios";

const WHATSAPP_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface TextMessagePayload {
  type: "text";
  to: string;
  message: string;
}

export interface TemplateMessagePayload {
  type: "template";
  to: string;
  templateName: string;
  templateLanguage: string;
  templateParams: string[];
}

export type MessagePayload = TextMessagePayload | TemplateMessagePayload;

export interface WhatsAppSendResult {
  messageId: string;
  status: "sent";
}

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  apiToken: string,
  payload: MessagePayload,
): Promise<WhatsAppSendResult> {
  let body: Record<string, unknown>;

  if (payload.type === "text") {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: payload.to,
      type: "text",
      text: {
        preview_url: false,
        body: payload.message,
      },
    };
  } else {
    const components: Record<string, unknown>[] = [];

    if (payload.templateParams && payload.templateParams.length > 0) {
      components.push({
        type: "body",
        parameters: payload.templateParams.map((value) => ({
          type: "text",
          text: value,
        })),
      });
    }

    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: payload.to,
      type: "template",
      template: {
        name: payload.templateName,
        language: {
          code: payload.templateLanguage || "en",
        },
        components,
      },
    };
  }

  const response = await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    body,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const messageId: string = response.data?.messages?.[0]?.id;

  if (!messageId) {
    throw new Error(
      `Unexpected WhatsApp API response: ${JSON.stringify(response.data)}`,
    );
  }

  return { messageId, status: "sent" };
}
