const axios = require("axios");
const fs = require("fs-extra");

const piped = "https://pipedapi.kavin.rocks";
const snapApi = "https://api.snapinsta.app/api/v1/media?url=";

module.exports = {
  config: {
    name: "alldl",
    version: "2.0.0",
    author: "Farhan (using open-source APIs)",
    countDown: 2,
    role: 0,
    description: {
      en: "Download video or image from TikTok, Instagram, Facebook, YouTube, Imgur, and others (via open APIs).",
    },
    category: "MEDIA",
    guide: {
      en: "[video_link]",
    },
  },

  onStart: async function ({ api, args, event }) {
    const link = event.messageReply?.body || args[0];
    if (!link) {
      return api.sendMessage("❗ Please provide a video/image link.", event.threadID, event.messageID);
    }

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      let downloadUrl, title = "Downloaded Media", ext = ".mp4";

      // 📺 YouTube detection
      if (/youtu\.be|youtube\.com/.test(link)) {
        const match = link.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/);
        const videoID = match ? match[1] : null;
        if (!videoID) throw new Error("Invalid YouTube link");

        const { data } = await axios.get(`${piped}/streams/${videoID}`);
        downloadUrl = data.videoStreams[0]?.url || data.audioStreams[0]?.url;
        title = data.title;
        ext = ".mp4";
      }

      // 🎵 TikTok, Instagram, Facebook, Twitter
      else if (/tiktok\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|pinterest\.com/.test(link)) {
        const { data } = await axios.get(`${snapApi}${encodeURIComponent(link)}`);
        if (data?.media && data.media[0]?.url) {
          downloadUrl = data.media[0].url;
          title = data.title || "Social Media Video";
          ext = data.media[0].type.includes("image") ? ".jpg" : ".mp4";
        } else {
          throw new Error("No downloadable media found from SnapInsta API.");
        }
      }

      // 🖼️ Imgur direct link
      else if (/i\.imgur\.com/.test(link)) {
        downloadUrl = link;
        ext = link.substring(link.lastIndexOf("."));
        title = "Imgur Media";
      }

      // 🧩 Fallback API (SaveFrom mirror)
      else {
        const fallback = await axios.get(`https://api.savefrom.lol/download?url=${encodeURIComponent(link)}`);
        downloadUrl = fallback.data?.url[0]?.url || null;
        if (!downloadUrl) throw new Error("Unsupported or invalid link.");
      }

      // 💾 Download media file
      const filePath = `${cacheDir}/media_${Date.now()}${ext}`;
      const { data: fileBuffer } = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));

      // ✅ Send result
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      await api.sendMessage(
        {
          body: `🎬 | ${title}\n✅ Download complete!`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.setMessageReaction("❎", event.messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
    }
  },
};
