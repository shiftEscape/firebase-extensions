import { logger } from "firebase-functions";
import { generateCompletionParams } from "./helpers.js";
import configData, { Config } from "./config.js";

export const initialize = (config: Config) => {
  logger.info(
    `[${config.namespace}] Initialized with config: ${JSON.stringify(config)}`
  );
  return generateCompletionParams(config);
};

export const receivedAPIResponse = (path: string, duration: number): void => {
  const formattedDuration = duration.toFixed(6);
  logger.info(
    `[${configData.namespace}] Received API response for document '${path}' in ${formattedDuration} ms.`,
    { duration: formattedDuration }
  );
};

export const errorCallingChatGPTAPI = (error: unknown): void => {
  const message = error instanceof Error ? error.message : "UNKNOWN ERROR";
  logger.error(
    `[${configData.namespace}] Error encountered calling OpenAI API: ${message}`
  );
};
