# 🪝 Instantly v2 Webhook Guide (n8n & Zapier)

Since the previous guide was moved, here is the updated reference for your automation workflows.

## 1. Webhook Configuration
- **Endpoint**: `POST`
- **Authentication**: (Optional) Use `X-Instantly-Signature` for verification.

---

## 2. Event Payloads

### `lead.replied`
Triggered instantly when a prospect responds to your sequence.
```json
{
  "event": "lead.replied",
  "data": {
    "leadId": "ld_123",
    "email": "prospect@example.com",
    "replyBody": "I'm interested, let's talk.",
    "sentiment": "positive"
  }
}
```

### `campaign.finished`
Triggered when a campaign runs out of leads.
```json
{
  "event": "campaign.finished",
  "data": {
    "campaignId": "cmp_456",
    "totalSent": 500,
    "totalReplies": 32
  }
}
```

---

## 3. n8n Routing Node
In your n8n workflow, use the **Switch** node mapped to `{{ $json.event }}`.
- **Path 1**: `lead.replied` ➔ AI Auto-Reply Node.
- **Path 2**: `campaign.finished` ➔ Slack Notification Node.
