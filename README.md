# Chatbot with ChatGPT

**Author**: Alvin James Bellero (**[https://github.com/shiftEscape](https://github.com/shiftEscape)**)

**Description**: Deploys basic, customizable chatbots using ChatGPT API and Cloud Firestore.

**Details**:

Use this extension to facilitate a basic deployment of a chatbot powered by OpenAI's [Chat Completions API](https://platform.openai.com/docs/guides/gpt/chat-completions-api) via this [NPM package](https://www.npmjs.com/package/chatgpt), with prompts and responses maintained and managed via [Cloud Firestore](https://firebase.google.com/docs/firestore).

Upon installation, you'll be prompted a list configuration parameters to customize your Chatbot implementation.

Your `prompt` might look like this:

```javascript
{
  prompt: “Please explain the Big Bag Theory to a five year-old”,
  parentMessageId: "(Optional) Message ID coming from API to track conversations"
}
```

**Additional Setup:**

Before installing this extension, make sure you have your own `OpenAI API Key` (you can get it from [here](https://platform.openai.com/)), and set up the following Firebase services in your Firebase project:

- **Cloud Firestore** to store prompts and AI responses.
  Follow the steps in the [documentation](https://firebase.google.com/docs/firestore/quickstart#create) to create a Cloud Firestore database.

## Billing

To install an extension, your project must be on the Blaze (pay as you go) plan. You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:

- Cloud Firestore
- Cloud Functions (See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))

This extension also uses the following third-party services:

- OpenAI ChatGPT ([pricing information](https://openai.com/pricing))

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

## Configuration Parameters

- **Collection Path**: Path to a Cloud Firestore collection which will represent a discussion with OpenAI's ChatGPT.

- **Prompt Field**: The field in the message document that contains the prompt. (Default: `prompt`)

- **Response Field**: The field in the message document into which to put the response. (Default: `response`)

- **Cloud Functions Location**: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- **Language Model**: Which language `model` do you want to use? Refer to [OpenAI's Model Reference](https://platform.openai.com/docs/models/overview).

- **Temperature**: What sampling `temperature` to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. [Learn more here](https://platform.openai.com/docs/api-reference/chat/create#chat/create-temperature).

- **Nucleus Sampling Probability**: An alternative to sampling with temperature, called `nucleus sampling`, where the model considers the results of the tokens with `top_p` probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. [Learn more here](https://platform.openai.com/docs/api-reference/chat/create#chat/create-top_p).

## Cloud Functions

- **`generateAIResponse()`**: Listens to Firestore data writes to generate conversations.

## Access Required

This extension will operate with the following project `IAM` roles:

- `datastore.user` (Reason: Allows this extension to access Cloud Firestore to read and process generated messages.)
