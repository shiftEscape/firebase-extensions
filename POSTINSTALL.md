## Testing the Extension

You can test out the extension right away by following these steps:

1. Go to the [Cloud Firestore Dashboard](https://console.firebase.google.com/project/_/firestore) in the Firebase console.
2. If it doesn't already exist, create the collection you specified during installation: **`${param:COLLECTION_NAME}`**.
3. Add a document with a **`${param:PROMPT_FIELD}`** field containing your first message:

```
${param:PROMPT_FIELD}: "How far is the moon from earth?"
```

4. In a few seconds, you'll see a `status` field containing `state`, `created_at` and `updated_at` keys added to the same document. This field will update as the extension processes the message.
5. When processing is finished, the `${param:RESPONSE_FIELD}` field of the document should be populated with the response from the ChatGPT API.

```typescript
const ref: DocumentReference = await admin
  .firestore()
  .collection("${param:COLLECTION_NAME}")
  .add({
    ${param:PROMPT_FIELD}: "How far is the moon from earth?",
  });

ref.onSnapshot((snap: DocumentSnapshot) => {
  if (snap.get("${param:RESPONSE_FIELD}")) {
    console.log(`RESPONSE: ${snap.get("${param:RESPONSE_FIELD}")}`);
  }
});
```

# Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
