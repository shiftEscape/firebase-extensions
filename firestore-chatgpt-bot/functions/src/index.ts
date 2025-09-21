import * as logs from "./utils/logs.js";
import functions from "firebase-functions/v1";
import { DocumentReference, FieldValue, WriteResult } from "firebase-admin/firestore";
import { ChatGPTAPI, ChatMessage } from "chatgpt";
import OpenAI from "openai";
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

// Check if we're using a GPT-5 model
const isGPT5Model = config.model.startsWith('gpt-5');

// Initialize OpenAI client for GPT-5 models
const openai = isGPT5Model ? new OpenAI({
  apiKey: config.apiKey,
  timeout: 120000, // 2 minutes timeout
}) : null;

// ChatGPT API Initialization (for non-GPT-5 models)
const chatgpt = !isGPT5Model ? new ChatGPTAPI({
  apiKey,
  completionParams,
  ...(systemMessage ? { systemMessage } : {}),
}) : null;

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

      let response: ChatMessage;

      if (isGPT5Model && openai) {
        try {
          // Use direct OpenAI API for GPT-5 models with timeout
          const completion = await Promise.race([
            openai.chat.completions.create({
              model: config.model,
              messages: [
                ...(systemMessage ? [{ role: "system" as const, content: systemMessage }] : []),
                { role: "user" as const, content: newPrompt }
              ],
              max_completion_tokens: 4000, // Increased for GPT-5 reasoning models
              // GPT-5 models only support default temperature (1) and top_p (1)
              // Don't set custom values for GPT-5 models
              ...(config.model.startsWith('gpt-5') ? {} : {
                ...(config.temperature ? { temperature: config.temperature } : {}),
                ...(config.topP ? { top_p: config.topP } : {}),
              }),
              stream: false, // Ensure non-streaming response
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('OpenAI API timeout after 60 seconds')), 60000)
            )
          ]) as any;

          const responseContent = completion.choices[0]?.message?.content || "";
          
          // Check if response is empty
          if (!responseContent || responseContent.trim() === "") {
            throw new Error("GPT-5 returned empty response");
          }

          response = {
            id: completion.id,
            text: responseContent,
            role: "assistant",
            parentMessageId: completion.id,
          };
        } catch (gpt5Error) {
          // Fallback to ChatGPT library if GPT-5 fails
          if (chatgpt) {
            try {
              response = await chatgpt.sendMessage(newPrompt, {
                ...(prevParentMsgId ? { [parentMessageIdField]: prevParentMsgId } : {}),
              });
            } catch (fallbackError) {
              throw new Error(`Both GPT-5 and fallback failed. GPT-5: ${gpt5Error.message}, Fallback: ${fallbackError.message}`);
            }
          } else {
            throw new Error(`GPT-5 failed and no fallback available: ${gpt5Error.message}`);
          }
        }
      } else if (chatgpt) {
        // Use ChatGPT library for other models
        response = await chatgpt.sendMessage(newPrompt, {
          ...(prevParentMsgId ? { [parentMessageIdField]: prevParentMsgId } : {}),
        });
      } else {
        throw new Error("No valid API client available");
      }

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