# Changelog

## Version 0.1.0

**Initial release.**

- Firestore document create trigger → sends WhatsApp message via Meta Cloud API
- Supports text messages and approved template messages with positional parameters
- Writes delivery status (`sent`, `error`) back to the triggering document
- HTTPS webhook receiver for Meta delivery status updates (`delivered`, `read`, `failed`)
- Configurable field names for `to`, `type`, `message`, `template_name`, `template_params`, `status`
- Supports all major Cloud Functions regions including `asia-southeast1` (Singapore) and `asia-southeast2` (Jakarta)
- Uses Gen 2 Cloud Functions (nodejs22 runtime)
- API tokens stored as Cloud Secret Manager secrets
