# Chatbot with ChatGPT

**Author**: Alvin James Bellero (**[https://alvinbellero.dev/](https://alvinbellero.dev/)**)

**Description**: Deploys customizable chatbots using ChatGPT API and Firestore.



**Details**: <!-- 
This file provides your users an overview of your extension. All content is optional, but this is the recommended format. Your users will see the contents of this file when they run the `firebase ext:info` command.

Include any important functional details as well as a brief description for any additional setup required by the user (both pre- and post-installation).

Learn more about writing a PREINSTALL.md file in the docs:
https://firebase.google.com/docs/extensions/publishers/user-documentation#writing-preinstall
-->

Use this extension to send a friendly greeting.

When triggered by an HTTP request, this extension responds with your specified friendly greeting.

<!-- We recommend keeping the following section to explain how billing for Firebase Extensions works -->
# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

<!-- List all products the extension interacts with -->
- Cloud Functions

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)




**Configuration Parameters:**

* Collection Path: Path to a Cloud Firestore collection which will represent a discussion with OpenAI's ChatGPT.

* Prompt Field: The field in the message document that contains the prompt.

* Response Field: The field in the message document into which to put the response.

* Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Language model: Which language model do you want to use?

* Temperature: What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random,  while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or `top_p` but not both.

* Nucleus Sampling Probability: An alternative to sampling with temperature, called nucleus sampling,  where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. We generally recommend altering this or `temperature` but not both.



**Cloud Functions:**

* **generateAIResponse:** Listens to Firestore data writes to generate conversations.



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process generated messages.)
