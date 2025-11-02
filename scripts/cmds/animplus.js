const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "animplus",
    aliases: ["animx", "promptanim", "ani2vid"],
    version: "1.0",
    author: "farhan",
    role: 0,
    description: "Animate photo via AI model (image + prompt)",
    category: "fun",
    guide: "Reply to image with: animplus <prompt>"
  },

  onStart: async function({ event, message, media }) {
    try {
      const body = event.body || "";
      const prompt = body.replace(/^animplus\s+/i, "").trim();
      if (!prompt) return message.reply("ℹ️ Please give a prompt: e.g. `animplus make the eyes blink`");

      // find image URL
      const imgURL = media?.url || event.messageReply?.attachments?.[0]?.url;
      if (!imgURL) return message.reply("❌ Please reply to an image or send one with the command.");

      // download image temporarily
      const tmpPath = path.join(__dirname, "cache");
      if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);
      const imgFile = path.join(tmpPath, `animplus_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(imgFile);
      const resp = await axios.get(imgURL, { responseType: "stream" });
      resp.data.pipe(writer);
      await new Promise(r => writer.on("finish", r));

      await message.reply("⏳ Generating animation... please wait a bit.");

      // send to AI API
      // Example endpoint: HF endpoint or your own model
      const API_URL = "https://api.your-animmodel.com/v1/animate"; // replace with real
      const key = process.env.ANIM_API_KEY; // if needed

      const form = new FormData();
      form.append("image", fs.createReadStream(imgFile));
      form.append("prompt", prompt);
      form.append("duration", "5"); // seconds

      const apiResp = await axios.post(API_URL, form, {
        headers: { 
          ...form.getHeaders(), 
          "Authorization": `Bearer ${key}`  // if needed
        },
        responseType: "arraybuffer",
        timeout: 120000
      });

      // save result
      const outFile = path.join(tmpPath, `animplus_out_${Date.now()}.mp4`);
      fs.writeFileSync(outFile, apiResp.data);

      await message.reply({
        body: `✅ Here’s your animation:\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(outFile)
      });

      fs.unlinkSync(imgFile);
      fs.unlinkSync(outFile);

    } catch (err) {
      console.error("animplus error:", err.response?.data || err.message);
      message.reply("❌ Something went wrong animating the image. Try a simpler prompt or later.");
    }
  }
};
    
