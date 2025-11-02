const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "imgupload",
    aliases: ["iu", "uploadimg", "upload"],
    version: "1.0",
    author: "Farhan",
    countDown: 2,
    role: 0,
    shortDescription: "Upload image to free URL host",
    longDescription: "Uploads any image from Messenger to a free public URL using Catbox.moe API",
    category: "utility",
    guide: {
      en: "{pn} [reply to image or send image with caption]",
    },
  },

  onStart: async function ({ message, event, args }) {
    try {
      let imageUrl;

      // Case 1: User replied to an image
      if (event.messageReply && event.messageReply.attachments?.length > 0) {
        const attachment = event.messageReply.attachments.find(a => a.type === "photo" || a.mime_type?.startsWith("image"));
        if (attachment) imageUrl = attachment.url;
      }

      // Case 2: User sent image directly
      if (!imageUrl && event.attachments?.length > 0) {
        const attachment = event.attachments.find(a => a.type === "photo" || a.mime_type?.startsWith("image"));
        if (attachment) imageUrl = attachment.url;
      }

      if (!imageUrl) {
        return message.reply("📸 Please reply to or send an image to upload.");
      }

      message.reply("⏳ Uploading your image... Please wait.");

      const uploadedLink = await uploadToCatbox(imageUrl);

      return message.reply(
        `✅ Uploaded Successfully!\n🌍 ${uploadedLink}`
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to upload image. Please try again.");
    }
  },
};

// 🔗 Free permanent hosting (Catbox.moe)
async function uploadToCatbox(imgUrl) {
  const form = new FormData();
  form.append("reqtype", "urlupload");
  form.append("url", imgUrl);

  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
  });

  if (res.status !== 200) throw new Error("Upload failed");
  return res.data.trim();
}
