export interface Config {
  namespace: string;
  apiKey: string;
  model: string;
  promptField: string;
  responseField: string;
  collectionName: string;
  temperature?: number;
  topP?: number;
  parentMessageIdField: string;
}

const config: Config = {
  namespace: "firestore-chatgpt-bot",
  apiKey: process.env.API_KEY || "",
  model: process.env.MODEL || "gpt-3.5-turbo",
  promptField: process.env.PROMPT_FIELD || "prompt",
  responseField: process.env.RESPONSE_FIELD || "response",
  collectionName: process.env.COLLECTION_NAME || "users/{userID}/messages",
  temperature: process.env.TEMPERATURE
    ? parseFloat(process.env.TEMPERATURE)
    : undefined,
  topP: process.env.TOP_P ? parseFloat(process.env.TOP_P) : undefined,
  parentMessageIdField: "parentMessageId",
};

export default config;
