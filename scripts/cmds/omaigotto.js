const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "omaigotto",
    aliases: ["omg", "omaigo", "animevoice"],
    version: "4.1-fixed",
    author: "Farhan",
    countDown: 1,
    role: 0,
    shortDescription: "Speak with a cute anime girl voice",
    longDescription: "Convert your text into a cute anime-girl (Omaigotto) voice using a working free TTS API.",
    category: "Fun",
    guide: {
      en: "{pn} <text>\nExample:\n• {pn} Hello senpai~",
    },
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) {
      return message.reply("💬 Please provide text to speak!\nExample: !omaigotto Hello there~");
    }

    const text = args.join(" ");
    const voice = "Kimberly"; // cute anime-like voice

    try {
      // 🎧 Generate TTS URL
      const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;

      // 🧩 Fetch audio as binary data
      const res = await axios.get(ttsUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Node.js)",
          "Accept": "audio/mpeg",
        },
      });

      // 🗂️ Prepare temp MP3 path
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `omaigotto_${Date.now()}.mp3`);

      // 💾 Save the MP3 file
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      // 🎀 Send the MP3 as attachment
      await message.reply({
        body: `🎀 Omaigotto says:`,
        attachment: fs.createReadStream(filePath),
      });

      // 🧹 Delete after sending
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ Omaigotto TTS Error:", err);
      message.reply("⚠️ Omaigotto couldn’t speak right now. Try again later!");
    }
  },
};
