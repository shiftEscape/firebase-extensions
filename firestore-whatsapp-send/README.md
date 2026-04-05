# Send Messages with WhatsApp 💬 📲

**Author**: Alvin James Bellero (**[https://github.com/shiftEscape](https://github.com/shiftEscape)**)

**Description**: Send WhatsApp messages via the Meta WhatsApp Cloud API triggered by Cloud Firestore document writes.

**Details**:

Use this extension to send WhatsApp messages powered by the [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api), with message documents maintained and managed via [Cloud Firestore](https://firebase.google.com/docs/firestore).

> 💡 This extension will listen to the specified collection path for new message documents.

Upon installation, you'll be prompted a list <a href="#configuration-parameters">configuration parameters</a> to customize your WhatsApp messaging implementation.

Your message document might look like this:

```javascript
// Text message
{
  to: "+60123456789",           // Recipient phone number in E.164 format
  type: "text",
  message: "Hello from Firebase! 👋",
  status: "pending"
}

// Template message
{
  to: "+60123456789",
  type: "template",
  template_name: "order_shipped",       // Your approved template name
  template_language: "en",
  template_params: ["ORD-1234", "2 days"],  // Positional body parameters
  status: "pending"
}
```

**Additional Setup:**

Before installing this extension, make sure you have:

1. A **Meta Developer Account** and a configured **WhatsApp Business App** (you can get started [here](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)).
2. Your **Phone Number ID** and **WhatsApp Business Account (WABA) ID** from the Meta Developer Portal under WhatsApp > API Setup.
3. A **Meta System User Access Token** with `whatsapp_business_messaging` permission from [Meta Business Manager](https://business.facebook.com/).
4. Set up the following Firebase services in your Firebase project:

   4.1. **Cloud Firestore** to store message documents and delivery statuses.
   Follow the steps in the [documentation](https://firebase.google.com/docs/firestore/quickstart#create) to create a Cloud Firestore database.

## Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service's no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 22 runtime. See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))

This extension also uses the following third-party services:

- Meta WhatsApp Cloud API ([pricing information](https://developers.facebook.com/docs/whatsapp/pricing))

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

## Configuration Parameters

- **`Firestore Database ID`**: The Firestore database to use. Use `(default)` for the default database, or enter a named database ID.

- **`Firestore Database Region`**: The region of your Firestore database. Must match the region where your database was created (e.g. `us-central1`, `asia-southeast1`).

- **`Cloud Functions Location`**: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- **`WhatsApp Cloud API Access Token`**: Your Meta system user access token with `whatsapp_business_messaging` permission. Stored securely in Cloud Secret Manager.

- **`WhatsApp Phone Number ID`**: The Phone Number ID associated with your WhatsApp Business Account. Found in Meta Developer Portal under WhatsApp > API Setup.

- **`WhatsApp Business Account ID`**: Your WhatsApp Business Account (WABA) ID. Used to verify incoming webhook payloads.

- **`Webhook Verify Token`**: A secret string you choose. Enter the same value when configuring the webhook in the Meta Developer Portal.

- **`Collection Path`**: Path to the Cloud Firestore collection that will trigger WhatsApp message sends.

- **`Recipient Phone Number Field`**: The document field containing the recipient's phone number in E.164 format. (Default: `to`)

- **`Message Type Field`**: The document field specifying the message type. Accepted values: `text` or `template`. (Default: `type`)

- **`Text Message Body Field`**: The document field containing the message body text, used when type is `text`. (Default: `message`)

- **`Template Name Field`**: The document field containing the approved template name, used when type is `template`. (Default: `template_name`)

- **`Template Language Field`**: The document field containing the template language code (e.g. `en`, `ms`, `id`). (Default: `template_language`)

- **`Template Parameters Field`**: The document field containing an array of strings used as positional parameters for the template body. (Default: `template_params`)

- **`Delivery Status Field`**: The document field where the extension writes back the send and delivery status. (Default: `status`)

## Cloud Functions

- **`sendWhatsAppMessageFn()`**: Listens for new documents in the specified Firestore collection and sends a WhatsApp message via the Meta Cloud API.

- **`whatsappWebhookFn()`**: Public HTTPS endpoint that receives delivery status webhooks from Meta and updates the corresponding Firestore document.

## Access Required

This extension will operate with the following project `IAM` roles:

- `datastore.user` (Reason: Allows this extension to access Cloud Firestore to read message documents and write back delivery status information.)
