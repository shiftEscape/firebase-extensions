import * as functions from "firebase-functions";
import * as logs from "./utils/logs";

import {DocumentReference, DocumentSnapshot} from "firebase-admin/firestore";
import {ChatGPTAPI, ChatMessage} from "chatgpt";
import {generateCompletionParams} from "./utils/helpers";

import config from "./utils/config";

const {
  apiKey,
  promptField,
  responseField,
  collectionName,
  parentMessageIdField,
} = config;

logs.init(config);

// ChatGPT initialization
const chatgpt = new ChatGPTAPI({
  apiKey,
  completionParams: generateCompletionParams(config),
});

exports.generateAIResponse = functions.firestore
  .document(collectionName)
  .onWrite(
    async (change: functions.Change<DocumentSnapshot>): Promise<void> => {
      // Exit onDelete
      if (!change.after) {
        return;
      }

      const ref: DocumentReference = change.after.ref;
      const newPrompt = await change.after.get(promptField);
      const parentMessageId = await change.after.get(parentMessageIdField);

      try {
        const t = performance.now();

        // Send message to ChatGPT
        const response: ChatMessage = await chatgpt.sendMessage(newPrompt, {
          ...(parentMessageId ? {parentMessageId} : {}),
        });

        // Log API performance
        const duration = performance.now() - t;
        logs.receivedAPIResponse(ref.path, duration);

        const {text, id} = response;

        // Write response to Firestore Doc
        ref.update({
          [responseField]: text,
          [parentMessageIdField]: id,
        });
      } catch (err) {
        logs.errorCallingChatGPTAPI(err);
      }

      return;
    }
  );
