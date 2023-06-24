import { openai } from "chatgpt";
import { Config } from "./config.js";

/**
 * Generates parameters for OpenAI's chat completion request from provided configuration.
 *
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
    ...(topP ? { top_p: topP } : {}),
  };
};

/**
 * Sanitizes the provided path by removing any leading or trailing slashes.
 *
 * @param {string} path - The Firestore path to sanitize.
 * @returns {string} - The sanitized path.
 */
export const sanitizePath = (path: string): string => {
  return path.replace(/^\/|\/$/g, "");
};

/**
 * Determines whether the provided path is a valid Firestore collection.
 * A path is considered a valid collection if it has an even number of path segments
 * after removing any leading or trailing slashes and filtering out any empty segments.
 *
 * @param {string} path - The Firestore path to validate.
 * @returns {[boolean, string]} - A tuple where the first element indicates whether the path is a valid collection
 * and the second element is the sanitized path if it is valid, or an empty string if it is not.
 */
export const isValidCollection = (path: string): [boolean, string] => {
  if (!path) return [false, ""];
  const sanitizedPath = sanitizePath(path);
  const pathSegments = sanitizedPath.split("/").filter(Boolean);
  const isValid = pathSegments.length % 2 !== 0;
  return [isValid, isValid ? sanitizedPath : ""];
};
