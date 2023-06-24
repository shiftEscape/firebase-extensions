import { openai } from "chatgpt";
import { Config } from "./config.js";

/**
 * Generates parameters for OpenAI's chat completion request from provided configuration.
 *
 * @function generateCompletionParams
 * @param {Config} config - The configuration object containing 'model', 'temperature' and 'topP' properties.
 * @returns {Partial<openai.CreateChatCompletionRequest>} An object representing partial parameters
 * for OpenAI's chat completion request. Properties 'model', 'temperature', and 'topP' are extracted
 * from the provided configuration. 'temperature' and 'topP' are optional.
 */
export const generateCompletionParams = (
  config: Config
): Partial<openai.CreateChatCompletionRequest> => {
  const { model, temperature, topP } = config;
  return {
    model,
    ...(temperature ? { temperature } : {}),
    ...(topP ? { topP } : {}),
  };
};
