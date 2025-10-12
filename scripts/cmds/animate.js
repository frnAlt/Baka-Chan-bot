const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// === Utilities ===
async function getStreamFromURL(url) {
  const res = await axios.get(url, { responseType: "stream" });
  return res.data;
}

function generateRandomId(len = 16) {
  const chars = "abcdef0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Fast token creation (simulated balance)
async function getPackId() {
  const pack = generateRandomId();
  try {
    await axios.post("https://api.getglam.app/rewards/claim/hdnu30r7auc4kve", null, {
      headers: {
        "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)",
        "glam-user-id": pack,
        "user_id": pack,
        "glam-local-date": new Date().toISOString()
      }
    });
  } catch {} // silent fail okay
  return pack;
}

async function uploadFile(pack, stream, prompt, duration = 5) {
  const form = new FormData();
  form.append("package_id", pack);
  form.append("media_file", stream);
  form.append("media_type", "image");
  form.append("template_id", "community_img2vid");
  form.append("template_category", "20_coins_dur");
  form.append("frames", JSON.stringify([{
    prompt,
    custom_prompt: prompt,
    start: 0,
    end: 0,
    timings_units: "frames",
    media_type: "image",
    style_id: "chained_falai_img2video",
    rate_modifiers: { duration: duration + "s" }
  }]));

  const res = await axios.post("https://android.getglam.app/v2/magic_video", form, {
    headers: { ...form.getHeaders(), "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)" },
    timeout: 10000 // prevent initial stall
  });

  return res.data.event_id;
}

async function getStatus(taskID, pack) {
  let attempt = 0;
  while (attempt < 30) { // 30s max wait
    const res = await axios.get("https://android.getglam.app/v2/magic_video", {
      params: { package_id: pack, event_id: taskID },
      headers: { "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)" }
    });
    if (res.data.status === "READY" && res.data.video_url) return res.data;
    await new Promise(r => setTimeout(r, 2000));
    attempt++;
  }
  throw new Error("Timeout waiting for video generation.");
}

// === Core ===
async function imgToVideo(prompt, filePath, duration = 5) {
  const pack = await getPackId();
  const task = await uploadFile(pack, fs.createReadStream(filePath), prompt, duration);
  return await getStatus(task, pack);
}

// === Command ===
module.exports = {
  config: {
    name: "animate",
    version: "2.1",
    author: "Farhan ✨",
    role: 0,
    description: "Animate a picture into a video using a text prompt",
    category: "fun",
    guide: "Reply to an image with: animate <prompt> [--long or -l for longer video]"
  },

  onStart: async function ({ event, message, media }) {
    try {
      const body = event.body || "";
      const prompt = body.replace(/^animate\s+/i, "").replace(/--long|-l/i, "").trim();
      if (!prompt) return message.reply("❌ | Please provide a prompt text.");

      const isLong = /--long|-l/i.test(body);
      const duration = isLong ? 12 : 5; // normal 5s, long = 12s

      if (!event.messageReply && !media)
        return message.reply("❌ | You must reply to an image to animate it.");

      // Download image first
      const url = media ? media.url || media.filePath : event.messageReply.attachments?.[0]?.url;
      if (!url) return message.reply("❌ | No valid image found.");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const filePath = path.join(cacheDir, `animate_${Date.now()}.png`);

      const writer = fs.createWriteStream(filePath);
      const res = await axios.get(url, { responseType: "stream" });
      res.data.pipe(writer);
      await new Promise(resolve => writer.on("finish", resolve));

      // Send waiting message first (non-blocking)
      await message.reply(`🎨 | Generating ${isLong ? "long " : ""}animation... Please wait 5–10s.`);

      // Process animation
      const result = await imgToVideo(prompt, filePath, duration);

      await message.reply({
        body: `🎬 | Done!\n📝 Prompt: ${prompt}\n⏱ Duration: ${duration}s`,
        attachment: await getStreamFromURL(result.video_url)
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ animate error:", err);
      message.reply("❌ | Failed to generate animation. Try again later.");
    }
  }
};
