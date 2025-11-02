const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "editv2",
    author: "Farhan",
    category: "ai",
    countDown: 5,
    role: 0,
    description: "Edit images using Qwen‑Image‑Edit AI",
    guide: { en: "editv2 <prompt> | reply to image" }
  },

  onStart: async function({ message, event, args }) {
    const prompt = args.join(" ").trim();
    const replyAttachment = event.messageReply?.attachments?.[0]?.url;

    if (!replyAttachment) {
      return message.reply("⚠️ Please reply to an image you want to edit.");
    }
    if (!prompt) {
      return message.reply("❌ Please provide a prompt describing the edit.");
    }

    message.reply("⏳ Editing your image—please wait...");

    try {
      // Use Qwen‑Image‑Edit API
      const apiUrl = "https://modelstudio.aliyun.com/api/qwen-image-edit";  // replace with actual working endpoint
      const payload = {
        prompt: prompt,
        image_url: replyAttachment,
        output_format: "png",
        guidance_scale: 4.0,
        num_inference_steps: 30
      };

      const apiRes = await axios.post(apiUrl, payload, { responseType: "json" });

      if (!apiRes.data?.image_url) {
        throw new Error("No image returned by API");
      }

      const outUrl = apiRes.data.image_url;
      const tempDir = path.join(__dirname, "cache");
      await fs.ensureDir(tempDir);
      const outPath = path.join(tempDir, `edited_${Date.now()}.png`);

      const imgBuf = await axios.get(outUrl, { responseType: "arraybuffer" });
      await fs.writeFile(outPath, imgBuf.data);

      await message.reply({
        body: `✅ Image edited!\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(outPath)
      });

      await fs.unlink(outPath);
    }
    catch (err) {
      console.error("Editv2 command error:", err);
      return message.reply("❌ Edit failed. Please try again later.");
    }
  }
};
