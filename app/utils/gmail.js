import { google } from 'googleapis';
import { supabase } from './supabase';

export class GmailService {
  constructor(userId) {
    this.userId = userId;
  }

  async initialize() {
    try {
      // Get the user's Gmail integration
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('platform', 'gmail')
        .single();

      if (error) throw error;
      if (!integration) throw new Error('Gmail integration not found');

      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/integration`
      );

      oauth2Client.setCredentials({
        access_token: integration.credentials.access_token,
        refresh_token: integration.credentials.refresh_token,
        expiry_date: integration.credentials.expires_at
      });

      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      return this;
    } catch (error) {
      console.error('Failed to initialize Gmail service:', error);
      throw error;
    }
  }

  async listMessages(query = 'in:inbox', maxResults = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      const messages = await Promise.all(
        response.data.messages.map(async (message) => {
          const details = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date']
          });

          const headers = details.data.payload.headers;
          return {
            id: message.id,
            threadId: message.threadId,
            subject: headers.find(h => h.name === 'Subject')?.value,
            from: headers.find(h => h.name === 'From')?.value,
            date: headers.find(h => h.name === 'Date')?.value,
            snippet: details.data.snippet
          };
        })
      );

      return messages;
    } catch (error) {
      console.error('Failed to list messages:', error);
      throw error;
    }
  }

  async getMessage(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get message:', error);
      throw error;
    }
  }

  async sendMessage(to, subject, body) {
    try {
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        'From: me',
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        body
      ];
      const message = messageParts.join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return res.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
} 