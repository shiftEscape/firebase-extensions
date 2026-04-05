## Complete setup in Meta Developer Portal

### 1. Register your webhook

1. In the Meta Developer Portal, go to **WhatsApp > Configuration > Webhooks**.
2. Click **Edit** and enter:
   - **Callback URL**: `${function:whatsappWebhookFn.url}`
   - **Verify Token**: the same value you entered for `WEBHOOK_VERIFY_TOKEN` during installation
3. Click **Verify and Save**.
4. Subscribe to the **messages** webhook field.

## How to send messages

Write a document to your configured collection path (`${param:COLLECTION_PATH}`):

### Text message

```js
await db.collection("${param:COLLECTION_PATH}").add({
  to: "+60123456789", // E.164 format
  type: "text",
  message: "Hello from Firebase! 👋",
  status: "pending",
});
```

### Template message

```js
await db.collection("${param:COLLECTION_PATH}").add({
  to: "+60123456789",
  type: "template",
  template_name: "order_shipped", // your approved template name
  template_language: "en",
  template_params: ["ORD-1234", "2 days"], // positional body params
  status: "pending",
});
```

## Document status lifecycle

The extension writes back to the `${param:STATUS_FIELD}` field as the message progresses:

| Status       | Meaning                                                            |
| ------------ | ------------------------------------------------------------------ |
| `pending`    | Waiting to be processed (set by your app)                          |
| `processing` | Extension has picked up the document                               |
| `sent`       | Meta accepted the message; `whatsapp_message_id` written to doc    |
| `delivered`  | Message delivered to recipient's device                            |
| `read`       | Message read by recipient                                          |
| `failed`     | Delivery failed; check the `error` field                           |
| `error`      | Extension error before sending (e.g. missing field, API rejection) |

## Monitoring

View function logs in the Firebase console under **Functions > Logs**, or run:

```bash
firebase functions:log --only ext-${param:EXT_INSTANCE_ID}-sendWhatsAppMessageFn
firebase functions:log --only ext-${param:EXT_INSTANCE_ID}-whatsappWebhookFn
```

## Need help?

- [Meta WhatsApp Cloud API docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp message templates](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Report issues](https://github.com/shiftEscape/firebase-extensions/issues)
