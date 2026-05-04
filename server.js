// ============================================
//   CHAQCHAQ - Node.js + Telegram API Server
// ============================================

const http = require('http');
const fs = require('fs');
const path = require('path');

let TelegramClient, StringSession, Api;
try {
  const tg = require('telegram');
  TelegramClient = tg.TelegramClient;
  StringSession = require('telegram/sessions').StringSession;
  Api = tg.Api;
} catch(e) {
  console.error('\n❌ GramJS topilmadi! Quyidagini ishga tushiring:\n');
  console.error('   npm install telegram\n');
  process.exit(1);
}

const API_ID   = 36295561;
const API_HASH = 'd522ed1e4a2e1b83b7b20552606a07d3';
const SESSION_FILE = './session.txt';
const PORT = 3000;

function loadSession() {
  try { if (fs.existsSync(SESSION_FILE)) return fs.readFileSync(SESSION_FILE,'utf8').trim(); } catch(e) {}
  return '';
}
function saveSession(str) { fs.writeFileSync(SESSION_FILE, str, 'utf8'); }

let client = null;
let isLoggedIn = false;
let pendingPhone = '';
let pendingHash = '';

async function initClient() {
  const session = new StringSession(loadSession());
  client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 });
  await client.connect();
  if (loadSession() && await client.isUserAuthorized()) {
    isLoggedIn = true;
    console.log('✅ Oldingi session topildi!');
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    try {
      const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end(html);
    } catch(e) { res.writeHead(404); res.end('index.html topilmadi'); }
    return;
  }

  let body = '';
  if (req.method === 'POST') {
    await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
  }

  const send = (data, status=200) => {
    res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'});
    res.end(JSON.stringify(data));
  };

  try {
    if (url === '/api/status') {
      send({ loggedIn: isLoggedIn });
      return;
    }

    if (url === '/api/send-code') {
      const { phone } = JSON.parse(body);
      pendingPhone = phone;
      const result = await client.sendCode({ apiId: API_ID, apiHash: API_HASH }, phone);
      pendingHash = result.phoneCodeHash;
      console.log('📱 Kod yuborildi:', phone);
      send({ ok: true });
      return;
    }

    if (url === '/api/verify-code') {
      const { code } = JSON.parse(body);
      try {
        await client.invoke(new Api.auth.SignIn({
          phoneNumber: pendingPhone,
          phoneCodeHash: pendingHash,
          phoneCode: code,
        }));
        saveSession(client.session.save());
        isLoggedIn = true;
        console.log('✅ Kirish muvaffaqiyatli!');
        send({ ok: true });
      } catch(e) {
        console.log('Sign in error:', e.errorMessage || e.message);
        if (e.errorMessage === 'SESSION_PASSWORD_NEEDED') {
          send({ ok: false, needPassword: true });
        } else if (e.errorMessage === 'PHONE_CODE_INVALID') {
          send({ ok: false, error: 'Noto\'g\'ri kod! Qayta urinib ko\'ring.' });
        } else if (e.errorMessage === 'PHONE_CODE_EXPIRED') {
          send({ ok: false, error: 'Kod muddati o\'tdi! Qayta yuboring.' });
        } else {
          send({ ok: false, error: e.errorMessage || e.message });
        }
      }
      return;
    }

    if (url === '/api/verify-password') {
      const { password } = JSON.parse(body);
      try {
        await client.signInWithPassword(
          { apiId: API_ID, apiHash: API_HASH },
          { password: async () => password, onError: async (e) => { throw e; } }
        );
        saveSession(client.session.save());
        isLoggedIn = true;
        console.log('✅ 2FA bilan kirish muvaffaqiyatli!');
        send({ ok: true });
      } catch(e) {
        send({ ok: false, error: 'Noto\'g\'ri parol!' });
      }
      return;
    }

    if (url === '/api/logout') {
      try { await client.invoke(new Api.auth.LogOut()); } catch(e) {}
      if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
      isLoggedIn = false;
      send({ ok: true });
      return;
    }

    if (url === '/api/me') {
      if (!isLoggedIn) { send({ error: 'Not logged in' }, 401); return; }
      const me = await client.getMe();
      send({
        id: me.id?.toString(),
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        phone: me.phone || '',
        username: me.username || '',
        premium: me.premium || false,
      });
      return;
    }

    if (url === '/api/dialogs') {
      if (!isLoggedIn) { send({ error: 'Not logged in' }, 401); return; }
      const dialogs = await client.getDialogs({ limit: 50 });
      const list = dialogs.map(d => ({
        id: d.id?.toString(),
        name: d.name || d.title || 'Unknown',
        type: d.isChannel ? 'channel' : d.isGroup ? 'group' : 'user',
        unread: d.unreadCount || 0,
        lastMessage: d.message?.message || '',
        date: d.date,
      }));
      send({ dialogs: list });
      return;
    }

    if (url === '/api/messages') {
      if (!isLoggedIn) { send({ error: 'Not logged in' }, 401); return; }
      const { id } = JSON.parse(body || '{}');
      const entity = await client.getEntity(id);
      const messages = await client.getMessages(entity, { limit: 40 });
      const me = await client.getMe();
      const myId = me.id?.toString();
      const list = [...messages].reverse().map(m => ({
        id: m.id,
        text: m.message || '',
        fromMe: m.senderId?.toString() === myId || m.out === true,
        date: m.date,
        type: m.media ? 'media' : 'text',
      }));
      send({ messages: list });
      return;
    }

    if (url === '/api/send-message') {
      if (!isLoggedIn) { send({ error: 'Not logged in' }, 401); return; }
      const { id, text } = JSON.parse(body);
      const entity = await client.getEntity(id);
      await client.sendMessage(entity, { message: text });
      send({ ok: true });
      return;
    }

    if (url === '/api/contacts') {
      if (!isLoggedIn) { send({ error: 'Not logged in' }, 401); return; }
      const result = await client.invoke(new Api.contacts.GetContacts({ hash: BigInt(0) }));
      const contacts = (result.users || []).map(u => ({
        id: u.id?.toString(),
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        phone: u.phone || '',
        username: u.username || '',
      }));
      send({ contacts });
      return;
    }

    res.writeHead(404); res.end('Not found');

  } catch(e) {
    console.error('API Error:', e.message);
    send({ error: e.message }, 500);
  }
});

(async () => {
  console.log('\n🚀 Chaqchaq Server ishga tushmoqda...');
  await initClient();
  server.listen(PORT, () => {
    console.log(`✅ Server tayyor: http://localhost:${PORT}`);
    console.log('📱 Brauzerda oching!\n');
  });
})();
