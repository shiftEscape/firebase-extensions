import * as functions from "firebase-functions";
import * as logs from "./utils/logs.js";

import {
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import { generateCompletionParams } from "./utils/helpers.js";

import config from "./utils/config.js";

const {
  apiKey,
  promptField,
  responseField,
  collectionName,
  parentMessageIdField,
} = config;

logs.initialize(config);

// ChatGPT initialization
const chatgpt = new ChatGPTAPI({
  apiKey,
  completionParams: generateCompletionParams(config),
});

export const generateAIResponse = functions.firestore
  .document(collectionName)
  .onWrite(
    async (change: functions.Change<DocumentSnapshot>): Promise<void> => {
      if (!change.after.exists) {
        return;
      }

      const newPrompt = await change.after.get(promptField);
      const callState = change.after.get("status.state");

      // Exit on invalid prompt and various status
      if (
        !newPrompt ||
        typeof newPrompt !== "string" ||
        ["PROCESSING", "COMPLETED", "ERRORED"].includes(callState)
      ) {
        return;
      }

      const ref: DocumentReference = change.after.ref;
      const parentMessageId = await change.after.get(parentMessageIdField);

      // Initial processing status
      await ref.update({
        status: {
          state: "PROCESSING",
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
      });

      try {
        const t = performance.now();

        // Send message to ChatGPT
        const response: ChatMessage = await chatgpt.sendMessage(newPrompt, {
          ...(parentMessageId ? { parentMessageId } : {}),
        });

        // Log API performance
        const duration = performance.now() - t;
        logs.receivedAPIResponse(ref.path, duration);

        const { text, id } = response;

        // Write response to Firestore Doc
        ref.update({
          [responseField]: text,
          [parentMessageIdField]: id,
          "status.state": "COMPLETED",
          "status.updated_at": FieldValue.serverTimestamp(),
        });
      } catch (err) {
        logs.errorCallingChatGPTAPI(err);

        // Update on API call error
        ref.update({
          "status.state": "ERRORED",
          "status.updated_at": FieldValue.serverTimestamp(),
        });
      }

      return;
    }
  );
