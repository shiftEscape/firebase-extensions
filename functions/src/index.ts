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

// ChatGPT initialization
const chatgpt = new ChatGPTAPI({ apiKey, completionParams });

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
        const t = performance.now();

        // Send message to ChatGPT
        const response: ChatMessage = await chatgpt.sendMessage(newPrompt, {
          ...(prevParentMsgId
            ? { [parentMessageIdField]: prevParentMsgId }
            : {}),
        });

        // Log API performance
        const duration = performance.now() - t;
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
