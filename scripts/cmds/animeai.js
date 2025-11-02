/**
 * animeai-obf.js
 * Light obfuscated anime conversion module (base64-encoded strings)
 * - Requires: set process.env.HF_TOKEN to your Hugging Face token (recommended)
 * - If you prefer embedding a token (not recommended), replace ENCODED_HF_TOKEN below.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const _d = (s) => Buffer.from(s, 'base64').toString('utf8');

// --- Encoded constants (base64) ---
const ENCODED_API_URL = 'aHR0cHM6Ly9hcGktaW5mZXJlbmNlLmhnLmlvL21vZGVscy9oYWt1cmVpL3dhaWZ1LWRpZmZ1c2lvbg=='; // https://api-inference.huggingface.co/models/hakurei/waifu-diffusion
// If you want to embed a token (not advised), put base64(token) below. Leave as empty string to use process.env.HF_TOKEN.
const ENCODED_HF_TOKEN = ''; 

// Some helper encoded messages
const MSG_WAIT = _d('44GT44KT44Gr44Gh44GvIHwgR2VuZXJhdGluZyBhbmltZS1zdHlsZSwgcGxlYXNlIHdhaXQu'); // "✨ | Generating anime-style, please wait."
const MSG_NO_TOKEN = _d('4pyTIMOgIG5vIHVuaXByb3ZlZCBIViB0b2tlbiBzZXQuIFNldCBwcm9jZXNzLmVudi5IRl9UT0tFTiB0byB5b3VyIHRva2VuLg=='); // "⚠️ no unproved HF token set. Set process.env.HF_TOKEN to your token."
const MSG_ERR = _d('4pyTIMOgIGVycm9yIGdlbmVyYXRpbmcgYW5pbWUuIFRyeSBhZ2Fpbi4='); // "⚠️ error generating anime. Try again."

module.exports = {
  config: {
    name: 'animeai',
    version: '1.2-obf',
    role: 0,
    author: 'frnwot & Farhan',
    countDown: 5,
    prefix: true,
    category: 'image',
    description: '🎨 Transform a photo into anime style (obfuscated strings).',
    guide: {
      en: '   {pn}animeai [reply to an image] or [/@mention|uid] or [prompt]'
    },
  },

  onStart: async ({ api, event }) => {
    const { senderID, mentions, messageReply, body, threadID } = event;
    let imageUrl;
    let promptText = '';
    let targetIDForFilename = senderID;

    // parse input
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
      imageUrl = messageReply.attachments[0].url;
      targetIDForFilename = messageReply.senderID;
      promptText = 'anime style portrait';
    } else {
      const args = (body || '').split(' ').slice(1);
      if (args.length > 0) promptText = args.join(' ');
      if (Object.keys(mentions || {}).length > 0) {
        const targetID = Object.keys(mentions)[0];
        imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
      } else {
        imageUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      }
      if (!promptText) promptText = 'anime portrait with soft lighting, high detail, vibrant colors';
    }

    if (!imageUrl) {
      return api.sendMessage("Please reply to an image or mention a user to anime-fy their picture.", threadID);
    }

    const apiUrl = _d(ENCODED_API_URL);
    // token preference: process.env.HF_TOKEN (recommended) else encoded token
    const hfToken = process.env.HF_TOKEN || (ENCODED_HF_TOKEN ? _d(ENCODED_HF_TOKEN) : null);
    if (!hfToken) {
      return api.sendMessage(MSG_NO_TOKEN, threadID);
    }

    // send interim message
    api.sendMessage(MSG_WAIT, threadID);

    try {
      // call the inference endpoint. We'll use the text-to-image input pattern (model-specific).
      // Use a simple request body that many HF models accept; adapt if model requires different shape.
      const payload = {
        inputs: {
          prompt: promptText,
          image: imageUrl // some endpoints accept image parameter; if not, we can instead fetch image and send multipart
        },
        options: { wait_for_model: true },
        parameters: {
          guidance_scale: 7.5,
          negative_prompt: 'blurry, bad anatomy, lowres'
        }
      };

      // Attempt a POST with JSON; if model needs binary, user can adapt later.
      const r = await axios.post(apiUrl, payload, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      });

      if (r && r.status === 200 && r.data) {
        // save result to file and send
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        const filePath = path.join(cacheDir, `anime_obf_${targetIDForFilename}_${Date.now()}.png`);
        fs.writeFileSync(filePath, Buffer.from(r.data, 'binary'));

        await api.sendMessage({
          body: `✅ Anime style generated\n🎨 Prompt: ${promptText}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          try { fs.unlinkSync(filePath); } catch (e) { /*ignore*/ }
        });
        return;
      } else {
        api.sendMessage(MSG_ERR, threadID);
      }

    } catch (e) {
      console.error('[animeai-obf] error:', e && e.toString ? e.toString() : e);
      api.sendMessage(MSG_ERR, threadID);
    }
  }
};
