## Before you begin

This extension uses the **Meta WhatsApp Cloud API** (free to integrate — you pay Meta per conversation, not per message). Before installing, complete the following steps.

### 1. Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an account if you don't have one.
2. Create a new App → choose **Business** type.
3. Add the **WhatsApp** product to your app.

### 2. Set up your WhatsApp Business Account

1. In your Meta Developer Portal, go to **WhatsApp > API Setup**.
2. Note your **Phone Number ID** — you'll need this during extension installation.
3. Note your **WhatsApp Business Account (WABA) ID**.
4. For production use, add and verify your own business phone number. (Meta provides a free test number for development.)

### 3. Generate an Access Token

1. In your Meta Business Manager, go to **System Users**.
2. Create or select a System User and assign it to your WhatsApp Business Account with **full control**.
3. Generate an access token with the `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
4. Copy the token — you'll enter it as a secret during installation.

### 4. Approve message templates (for outbound messages)

WhatsApp requires **pre-approved templates** for business-initiated messages (the first message you send to a user). Text replies within 24 hours of a user-initiated message can use free-form text.

Create and submit templates in **Meta Business Manager > WhatsApp Manager > Message Templates**.

### 5. Firebase project requirements

- Your Firebase project must be on the **Blaze (pay as you go)** plan.
- **Cloud Firestore** must be enabled.

## Billing

This extension uses the following Firebase and Google Cloud services:

- **Cloud Firestore** — reads and writes (free tier: 50K reads, 20K writes/day)
- **Cloud Functions** (2nd gen / Cloud Run) — function invocations

This extension also uses the following third-party service:

- **Meta WhatsApp Cloud API** — [pricing](https://developers.facebook.com/docs/whatsapp/pricing)
  - Free tier: 1,000 user-initiated conversations per month
  - Business-initiated conversations billed per 24-hour session by country

## Configuration

You'll be asked to provide:

| Parameter            | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| WhatsApp API Token   | Your Meta system user access token (stored as a Secret)              |
| Phone Number ID      | Found in Meta Developer Portal > WhatsApp > API Setup                |
| Business Account ID  | Your WABA ID                                                         |
| Webhook Verify Token | A secret string you choose — enter the same in Meta's webhook config |
| Collection Path      | Firestore collection to watch for new message documents              |
| Field names          | Customisable field names for `to`, `type`, `message`, `status`, etc. |
