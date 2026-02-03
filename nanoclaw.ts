#!/usr/bin/env node
/**
 * NanoClaw - Single File Version
 *
 * A minimal WhatsApp-to-Claude bridge.
 * One chat, one assistant, no features beyond responding to messages.
 *
 * Usage:
 *   npm install @whiskeysockets/baileys @anthropic-ai/sdk qrcode-terminal
 *   tsx nanoclaw.ts
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// ========== CONFIG ==========

const ASSISTANT_NAME = 'Andy';
const AUTH_DIR = path.join(process.cwd(), 'store', 'auth');
const HISTORY_FILE = path.join(process.cwd(), 'history.jsonl');
const MAX_HISTORY = 100;

// ========== STATE ==========

let sock: WASocket;
const anthropic = new Anthropic();

// ========== HISTORY ==========

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function loadHistory(): Message[] {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  const lines = fs.readFileSync(HISTORY_FILE, 'utf-8').trim().split('\n').filter(Boolean);
  return lines.map(line => JSON.parse(line));
}

function saveHistory(history: Message[]): void {
  const lines = history.map(m => JSON.stringify(m)).join('\n');
  fs.writeFileSync(HISTORY_FILE, lines);
}

function addToHistory(role: 'user' | 'assistant', content: string): void {
  const history = loadHistory();
  history.push({ role, content, timestamp: new Date().toISOString() });
  // Keep only recent messages
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  saveHistory(history);
}

// ========== WHATSAPP ==========

async function connectWhatsApp(): Promise<void> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: { creds: state.creds, keys: state.keys },
    printQRInTerminal: true,
    browser: ['NanoClaw', 'Chrome', '1.0.0']
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('\nScan QR code to authenticate');
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`Connection closed. Reason: ${reason}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        connectWhatsApp();
      } else {
        console.log('Logged out. Delete store/auth and restart.');
        process.exit(0);
      }
    } else if (connection === 'open') {
      console.log(`\n✓ Connected to WhatsApp`);
      console.log(`✓ Assistant: ${ASSISTANT_NAME}`);
      console.log(`✓ Send messages from your phone to chat\n`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;

      const chatJid = msg.key.remoteJid;
      if (!chatJid || chatJid === 'status@broadcast') continue;

      // Skip own messages
      if (msg.key.fromMe) continue;

      // Extract text content
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!text) continue;

      console.log(`\n[${new Date().toLocaleTimeString()}] Received: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);

      // Show typing indicator
      await sock.sendPresenceUpdate('composing', chatJid);

      // Get Claude response
      try {
        const response = await getResponse(text);
        console.log(`[${new Date().toLocaleTimeString()}] Sent: ${response.slice(0, 100)}${response.length > 100 ? '...' : ''}`);

        await sock.sendMessage(chatJid, { text: `${ASSISTANT_NAME}: ${response}` });

        addToHistory('user', text);
        addToHistory('assistant', response);
      } catch (err) {
        console.error('Error:', err);
        await sock.sendMessage(chatJid, { text: `${ASSISTANT_NAME}: Sorry, something went wrong.` });
      }

      await sock.sendPresenceUpdate('paused', chatJid);
    }
  });
}

// ========== CLAUDE ==========

async function getResponse(userMessage: string): Promise<string> {
  const history = loadHistory();

  // Convert to Anthropic format (last 20 messages for context)
  const messages = history
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content }));

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages,
    system: `You are ${ASSISTANT_NAME}, a helpful AI assistant. Respond concisely and conversationally.`
  });

  const block = response.content.find(b => b.type === 'text');
  return block && 'text' in block ? block.text : 'Sorry, I could not generate a response.';
}

// ========== MAIN ==========

async function main(): Promise<void> {
  console.log('NanoClaw - Single File Version\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  await connectWhatsApp();
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
