/* eslint-disable max-len */
import {logger} from "firebase-functions";
import configData, {Config} from "./config";

export const init = (config: Config) => {
  logger.info(
    `[${config.namespace}] Initialized with config: ${JSON.stringify(config)}`
  );
};

export const warnMissingPromptOrResponse = (path: string) => {
  logger.warn(
    `[${configData.namespace}] Document '${path}' is missing either a prompt or response field.`
  );
};

export const receivedAPIResponse = (
  path: string,
  duration: number
) => {
  logger.info(
    `[${configData.namespace}] Received API response for document '${path}' in ${duration}ms.`,
    {duration}
  );
};

export const errorCallingChatGPTAPI = (error: unknown) => {
  const message = error instanceof Error ? error.message : "UNKNOWN ERROR";

  logger.error(
    `[${configData.namespace}] Error encountered calling GLM API: ${message}`
  );
};
