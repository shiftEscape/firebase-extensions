import {openai} from "chatgpt";
import {Config} from "./config";

export const generateCompletionParams = (
  config: Config
): Partial<openai.CreateChatCompletionRequest> => {
  const {model, temperature, topP} = config;
  return {
    model,
    ...(temperature ? {temperature} : {}),
    ...(topP ? {topP} : {}),
  };
};
