const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { findUid } = global.utils;

// === Helper: Stream from URL ===
async function getStreamFromURL(url) {
  const res = await axios.get(url, { responseType: "stream" });
  return res.data;
}

// === Helper: Random ID ===
function generateRandomId(len = 16) {
  const chars = "abcdef0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// === GLAM API Simulation (Optimized) ===
async function getBalance() {
  const pack = generateRandomId();
  // No need to await here since we just simulate
  axios.post("https://api.getglam.app/rewards/claim/hdnu30r7auc4kve", null, {
    headers: {
      "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)",
      "glam-user-id": pack,
      "user_id": pack,
      "glam-local-date": new Date().toISOString(),
    },
  }).catch(() => {});
  return pack;
}

async function uploadFile(pack, stream, prompt, duration) {
  const form = new FormData();
  form.append("package_id", pack);
  form.append("media_file", stream);
  form.append("media_type", "image");
  form.append("template_id", "community_img2vid");
  form.append("template_category", "20_coins_dur");
  form.append("frames", JSON.stringify([
    {
      prompt,
      custom_prompt: prompt,
      start: 0,
      end: 0,
      timings_units: "frames",
      media_type: "image",
      style_id: "chained_falai_img2video",
      rate_modifiers: { duration: `${duration}s` },
    },
  ]));

  const res = await axios.post("https://android.getglam.app/v2/magic_video", form, {
    headers: { ...form.getHeaders(), "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)" },
  });
  return res.data.event_id;
}

async function getStatus(taskID, pack) {
  const maxWait = 20_000; // 20s max wait
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await axios.get("https://android.getglam.app/v2/magic_video", {
      params: { package_id: pack, event_id: taskID },
      headers: { "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)" },
    });

    if (res.data.status === "READY" && res.data.video_url) return res.data.video_url;
    if (res.data.status === "FAILED") throw new Error("Video generation failed");
    await new Promise(r => setTimeout(r, 1200));
  }

  throw new Error("Timeout: Video generation took too long");
}

async function imgToVideo(prompt, filePath, duration = 4) {
  const pack = await getBalance();
  const task = await uploadFile(pack, fs.createReadStream(filePath), prompt, duration);
  return await getStatus(task, pack);
}

// === Avatar Fetch ===
async function getAvatar(uid, usersData) {
  try {
    return await usersData.getAvatarUrl(uid);
  } catch {
    return `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
  }
}

// === Merge Two Avatars ===
async function mergeAvatars(url1, url2) {
  const [img1, img2] = await Promise.all([loadImage(url1), loadImage(url2)]);
  const size = 512;
  const canvas = createCanvas(size * 2, size);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img1, 0, 0, size, size);
  ctx.drawImage(img2, size, 0, size, size);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `kiss1_${Date.now()}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

// === Command ===
module.exports = {
  config: {
    name: "kiss1",
    version: "2.1.0",
    author: "Farhan & Hina",
    role: 0,
    description: "💋 Create a romantic kiss animation between two users",
    category: "fun",
    guide: {
      en: "Reply or use:\n• {pn} @User1 @User2\n• {pn} @someone\n• reply with {pn}",
    },
  },

  onStart: async function ({ event, message, usersData, args }) {
    let uid1, uid2;

    // === Reply mode ===
    if (event.messageReply && event.messageReply.senderID) {
      uid1 = event.senderID;
      uid2 = event.messageReply.senderID;
    }

    // === Two mentions ===
    else if (Object.keys(event.mentions).length === 2) {
      const [m1, m2] = Object.keys(event.mentions);
      uid1 = m1;
      uid2 = m2;
    }

    // === One mention (sender kisses mentioned) ===
    else if (Object.keys(event.mentions).length === 1) {
      uid1 = event.senderID;
      uid2 = Object.keys(event.mentions)[0];
    }

    // === Two manual inputs ===
    else if (args.length >= 2) {
      uid1 = await findUid(args[0]);
      uid2 = await findUid(args[1]);
    } else {
      return message.reply("❌ Use correctly!\nExample:\n• kiss1 @someone\n• reply to someone\n• kiss1 @User1 @User2");
    }

    // Parallel data fetching for speed
    const [url1, url2, name1, name2] = await Promise.all([
      getAvatar(uid1, usersData),
      getAvatar(uid2, usersData),
      usersData.getName(uid1),
      usersData.getName(uid2),
    ]);

    const prompt = "two people kissing each other, romantic, cinematic, realistic";
    const waitMsg = await message.reply("💞 Creating your custom kiss video... Please wait a few seconds ⏳");

    try {
      const mergedPath = await mergeAvatars(url1, url2);
      const videoUrl = await imgToVideo(prompt, mergedPath, 3); // shorter duration for faster output

      await message.reply({
        body: `💋 | ${name1} kissed ${name2}! 💞`,
        attachment: await getStreamFromURL(videoUrl),
      });

      fs.unlinkSync(mergedPath);
      message.unsend(waitMsg.messageID);
    } catch (err) {
      console.error("kiss1 error:", err);
      message.reply("❌ Couldn't generate the kiss video right now. Try again later.");
    }
  },
};
