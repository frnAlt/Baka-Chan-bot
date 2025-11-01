const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "anime",
    aliases: ["supanime", "ani"],
    version: "1.1",
    author: "Farhan",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Generate anime style image"
    },
    longDescription: {
      en: "Generate an anime style image from a text prompt using a free working API"
    },
    category: "ai-image",
    guide: {
      en: "{pn} dog\n{pn} girl with sword"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const prompt = args.join(" ");
      if (!prompt) {
        return message.reply("⚠️ Please provide a prompt.\nExample: anime dog");
      }

      await message.reply("⏳ Generating anime image...");

      // 🛠️ Replace with a working free API for image generation
      const apiUrl = `https://some-free-anime-image.api/generate?prompt=${encodeURIComponent(prompt)}`;

      const imgPath = path.join(__dirname, "cache", `anime_${Date.now()}.jpg`);
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });

      fs.mkdirSync(path.dirname(imgPath), { recursive: true });
      fs.writeFileSync(imgPath, res.data);

      await message.reply({
        body: `✅ Anime Image Generated!\n🎨 Prompt: ${prompt}`,
        attachment: fs.createReadStream(imgPath)
      });

      // Clean up after a delay
      setTimeout(() => {
        try { fs.unlinkSync(imgPath); } catch(e) { /* ignore */ }
      }, 5000);

    } catch (err) {
      console.error("anime command error:", err.message);
      return message.reply("❌ Failed to generate anime image.");
    }
  }
};
