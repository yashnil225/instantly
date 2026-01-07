export async function instantlyGetEmails(email: string, apiKey: string) {
  const response = await fetch(`https://api.instantly.ai/api/v2/emails?email=${email}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instantly API error (Get Emails): ${error}`);
  }

  return response.json();
}

export async function instantlySendReply(options: {
  apiKey: string,
  eaccount: string,
  reply_to_uuid: string,
  subject: string,
  html_body: string
}) {
  const response = await fetch('https://api.instantly.ai/api/v2/emails/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      account: options.eaccount,
      reply_to_number: options.reply_to_uuid, // Double check if it's reply_to_number or uuid in v2
      subject: options.subject,
      body: options.html_body
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instantly API error (Send Reply): ${error}`);
  }

  return response.json();
}

export async function instantlyCreateCampaign(apiKey: string, payload: any) {
  const response = await fetch('https://api.instantly.ai/api/v2/campaigns', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instantly API error (Create Campaign): ${error}`);
  }

  return response.json();
}
