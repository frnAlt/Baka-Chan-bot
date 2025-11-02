module.exports = {
  config: {
    name: "tiktokss",
    aliases: ["ttss", "tss"],
    author: "Farhan & Tawsif",
    role: 0,
    category: "Image",
    description: "📸 Capture a TikTok profile screenshot using username or profile link"
  },

  onStart: async function ({ message, args }) {
    try {
      const input = (args || []).join(" ").trim();
      if (!input) {
        return message.reply(
          "📸 Usage: tiktokss <tiktok_username_or_profile_url>\n" +
          "Example:\n• tiktokss @charlidamelio\n• tiktokss https://www.tiktok.com/@charlidamelio"
        );
      }

      // Extract TikTok username from URL or simple input
      let username = null;
      const urlMatch = input.match(/tiktok\.com\/@([A-Za-z0-9._-]+)/i);
      if (urlMatch && urlMatch[1]) {
        username = urlMatch[1];
      } else {
        const nameMatch = input.match(/@?([A-Za-z0-9._-]+)/);
        if (nameMatch && nameMatch[1]) username = nameMatch[1];
      }

      if (!username) {
        return message.reply("❌ Couldn't detect a valid TikTok username. Please use @username or a TikTok profile link.");
      }

      const profileUrl = `https://www.tiktok.com/@${username}`;
      const screenshotUrl = `https://image.thum.io/get/width/1920/crop/1080/fullpage/${encodeURIComponent(profileUrl)}`;

      // Notify user
      await message.reply(`🕓 Capturing TikTok profile for **@${username}**...`);

      // Fetch the screenshot stream
      const stream = await global.utils.getStreamFromURL(screenshotUrl);

      if (!stream) {
        return message.reply("⚠️ Unable to fetch screenshot. The TikTok profile may be private or the screenshot API is unavailable.");
      }

      // Send the screenshot
      await message.reply({
        attachment: stream,
        body: `✅ TikTok Profile Screenshot\n👤 @${username}\n🔗 ${profileUrl}`
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Error: Something went wrong while capturing the TikTok profile screenshot.");
    }
  }
};
