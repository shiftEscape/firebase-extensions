import { openai } from "chatgpt";
import { logger } from "firebase-functions";
import { generateCompletionParams } from "./helpers.js";
import configData, { Config } from "./config.js";

/**
 * Initializes the application with the provided configuration, and generates parameters for
 * OpenAI's chat completion request from this configuration.
 *
 * @param {Config} config - The configuration object to initialize the application with.
 * @returns {Partial<openai.CreateChatCompletionRequest>} An object representing partial parameters
 * for OpenAI's chat completion request.
 */
export const initialize = (
  config: Config
): Partial<openai.CreateChatCompletionRequest> => {
  logger.info(
    `✅ [${config.namespace}] Initialized with config: ${JSON.stringify(
      config
    )}`
  );
  return generateCompletionParams(config);
};

/**
 * Logs the duration it took to receive an API response for a specified document path.
 *
 * @param {string} path - The path of the document for which the API response was received.
 * @param {number} duration - The time it took to receive the API response, in milliseconds.
 * @returns {void}
 */
export const receivedAPIResponse = (path: string, duration: number): void => {
  const formattedDuration = duration.toFixed(6);
  logger.info(
    `✅ [${configData.namespace}] Received API response for document '${path}' in ${formattedDuration} ms.`,
    { duration: formattedDuration }
  );
};

/**
 * Logs an error encountered when calling the OpenAI API.
 *
 * @param {unknown} error - The error that was encountered.
 * @returns {void}
 */
export const errorCallingChatGPTAPI = (error: unknown): void => {
  const message = error instanceof Error ? error.message : "UNKNOWN ERROR";
  logger.error(
    `❗️[${configData.namespace}] Error encountered calling OpenAI API: ${message}`
  );
};
