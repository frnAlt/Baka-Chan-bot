const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { shortenURL } = global.utils;

// 🔗 Stream helper
async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: "stream" });
  return response.data;
}

// 🧠 Author integrity check
async function checkAuthor(authorName) {
  try {
    const res = await axios.get("https://author-check.vercel.app/name");
    return res.data.name === authorName;
  } catch (err) {
    console.error("Author check failed:", err);
    return false;
  }
}

// 📺 Platform searchers
async function searchYouTube(query) {
  try {
    const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`);
    return res.data?.slice(0, 10).map((v) => ({
      title: v.title,
      url: `https://youtube.com/watch?v=${v.url.split("/").pop()}`,
      author: v.uploaderName,
      thumbnail: v.thumbnail,
    }));
  } catch (err) {
    console.error("YouTube search error:", err);
    return [];
  }
}

async function searchTikTok(query) {
  try {
    const res = await axios.get(`https://ttdownloaderapi.vercel.app/search?query=${encodeURIComponent(query)}`);
    return res.data?.results?.map((v) => ({
      title: v.title || "TikTok Video",
      url: v.videoUrl,
      author: v.author,
      thumbnail: v.thumbnail,
    }));
  } catch (err) {
    console.error("TikTok search error:", err);
    return [];
  }
}

async function searchInstagram(query) {
  try {
    const res = await axios.get(`https://snapinsta.app/api/v1/media?url=${encodeURIComponent(query)}`);
    if (res.data?.media?.length)
      return [
        {
          title: "Instagram Media",
          url: res.data.media[0].url,
          author: res.data.author || "Instagram",
          thumbnail: res.data.media[0].thumbnail || null,
        },
      ];
    return [];
  } catch (err) {
    console.error("Instagram fetch error:", err);
    return [];
  }
}

// 🧩 Universal platform fetcher
async function fetchVideos(platform, query) {
  switch (platform) {
    case "tiktok":
      return await searchTikTok(query);
    case "instagram":
      return await searchInstagram(query);
    case "youtube":
    default:
      return await searchYouTube(query);
  }
}

// 🚀 Main command
module.exports = {
  config: {
    name: "fyp",
    aliases: ["video", "mediafind"],
    author: "Vex_Kshitiz",
    version: "2.0",
    shortDescription: {
      en: "Search and send random video from YouTube, TikTok, or Instagram.",
    },
    longDescription: {
      en: "Finds random video content from YouTube (default), TikTok, or Instagram and sends it with a short link.",
    },
    category: "Fun",
    guide: {
      en: "{p}{n} [platform] [keyword]\n\nExample:\n• {p}{n} youtube lofi mix\n• {p}{n} tiktok funny cat\n• {p}{n} instagram https://www.instagram.com/p/.../",
    },
  },

  onStart: async function ({ api, event, args }) {
    // 🛡️ Author verification
    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      return api.sendMessage("⚠️ Author changer alert! This command belongs to Vex_Kshitiz.", event.threadID, event.messageID);
    }

    // 🧠 Parse args
    const [platformRaw, ...rest] = args;
    let platform = "youtube";
    let query = "";

    if (["youtube", "yt", "tiktok", "tt", "instagram", "ig"].includes(platformRaw?.toLowerCase())) {
      platform = platformRaw.toLowerCase();
      query = rest.join(" ");
    } else {
      query = args.join(" ");
    }

    if (!query) return api.sendMessage("⚠️ Please provide a search keyword or link!", event.threadID, event.messageID);

    api.setMessageReaction("🔎", event.messageID, () => {}, true);

    try {
      const results = await fetchVideos(platform, query);
      if (!results || results.length === 0) {
        return api.sendMessage(`❌ No results found for: ${query}`, event.threadID, event.messageID);
      }

      // 🎯 Pick a random result
      const selected = results[Math.floor(Math.random() * results.length)];
      const shortUrl = await shortenURL(selected.url);

      // 🧾 Message text
      const infoMsg = `🎬 | ${selected.title}\n👤 ${selected.author}\n🌐 ${shortUrl}\n\n📺 Source: ${platform.toUpperCase()}`;

      // 🖼️ Download + send thumbnail or video
      if (selected.thumbnail) {
        const thumbStream = await getStreamFromURL(selected.thumbnail);
        await api.sendMessage(
          { body: infoMsg, attachment: thumbStream },
          event.threadID,
          event.messageID
        );
      } else {
        await api.sendMessage({ body: infoMsg }, event.threadID, event.messageID);
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error("❌ Error fetching video:", err);
      api.sendMessage("⚠️ Error while fetching video. Try again later.", event.threadID, event.messageID);
      api.setMessageReaction("❎", event.messageID, () => {}, true);
    }
  },
};
