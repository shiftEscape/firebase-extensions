import * as logs from "./utils/logs.js";
import functions from "firebase-functions/v1";
import { DocumentReference, FieldValue, WriteResult } from "firebase-admin/firestore";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import config, { StatusType } from "./utils/config.js";

const {
  apiKey,
  promptField,
  responseField,
  systemMessage,
  collectionName,
  parentMessageIdField,
} = config;

// Generate `completionParams`
const completionParams = logs.initialize(config);

// ChatGPT API Initialization
const chatgpt = new ChatGPTAPI({
  apiKey,
  completionParams,
  ...(systemMessage ? { systemMessage } : {}),
});

/**
 * Generates the response to a new prompt and writes it to the appropriate document in Firestore.
 * @param {FirestoreEvent<Change<DocumentSnapshot>>} event - The event that triggered the function.
 * @returns {Promise<WriteResult | void>}
 */
export const generateAIResponse = functions.firestore
  .document(collectionName)
  .onWrite(async (event): Promise<WriteResult | void> => {

    // Exit on deleted document
    if (!event.after.exists) {
      return;
    }

    // Get firestore after data
    const newPrompt = event.after.get(promptField);
    const apiCallState = event.after.get("status.state");

    // Exit on invalid prompt and various status
    if (
      !newPrompt ||
      typeof newPrompt !== "string" ||
      Object.keys(StatusType).includes(apiCallState)
    ) {
      return;
    }

    const ref: DocumentReference = event.after.ref;
    const prevParentMsgId: string | undefined =
      event.after.get(parentMessageIdField);

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
        ...(prevParentMsgId ? { [parentMessageIdField]: prevParentMsgId } : {}),
      });

      // Log API performance
      const duration = performance.now() - logStartTime;
      logs.receivedAPIResponse(ref.path, duration);

      const { text, parentMessageId } = response;

      // Write response to Firestore Doc
      return await ref.update({
        [responseField]: text,
        [parentMessageIdField]: parentMessageId,
        "status.state": StatusType.COMPLETED,
        "status.updated_at": FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logs.errorCallingChatGPTAPI(err);

      // Update on API call error
      return await ref.update({
        "status.state": StatusType.ERRORED,
        "status.updated_at": FieldValue.serverTimestamp(),
      });
    }
  });
