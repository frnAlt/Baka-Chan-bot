const axios = require("axios");
const fs = require("fs");
const ytdl = require("@distube/ytdl-core");

module.exports = {
  config: {
    name: "ytb",
    aliases: ["youtube"],
    version: "2.1.0",
    author: "Farhan",
    countDown: 3,
    role: 0,
    category: "media",
    description: "Search or download YouTube videos or audio instantly",
    guide: {
      en: "{pn} <query> -v → video\n{pn} <query> -a → audio\n{pn} <query> → search results"
    }
  },

  onStart: async function ({ message, args }) {
    const query = args.join(" ");
    if (!query) return message.reply("⚠️ | Enter a YouTube title or link.");

    const isAudio = query.includes("-a");
    const isVideo = query.includes("-v");
    const searchQuery = query.replace(/-a|-v/g, "").trim();

    try {
      // 🔎 Fast search
      const { data } = await axios.get(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(searchQuery)}`);
      const videos = data.filter(v => v.type === "video");
      if (videos.length === 0) return message.reply("❌ | No results found.");

      const first = videos[0];
      const url = `https://www.youtube.com/watch?v=${first.id}`;
      const title = first.title;

      if (!isAudio && !isVideo) {
        // 🧾 Show top 5 results (fast)
        const resultText = videos
          .slice(0, 5)
          .map((v, i) => `${i + 1}. ${v.title}\n👤 ${v.uploaderName}\n⏱ ${v.duration}\n🔗 https://youtu.be/${v.id}\n`)
          .join("\n");
        return message.reply("🎬 **Top 5 Results:**\n\n" + resultText);
      }

      const filePath = __dirname + `/${Date.now()}.${isAudio ? "mp3" : "mp4"}`;
      const stream = ytdl(url, {
        filter: isAudio ? "audioonly" : "videoandaudio",
        quality: isAudio ? "highestaudio" : "highestvideo",
        highWaterMark: 1 << 25 // prevents lag in long videos
      });

      const file = fs.createWriteStream(filePath);
      stream.pipe(file);

      message.reply(`⬇️ | Downloading ${isAudio ? "audio" : "video"}: ${title}`);

      file.on("finish", async () => {
        await message.reply({
          body: `${isAudio ? "🎵" : "🎬"} | **${title}**`,
          attachment: fs.createReadStream(filePath)
        });
        fs.unlinkSync(filePath);
      });

      stream.on("error", err => {
        console.error(err);
        message.reply("❌ | Download failed. Try another video.");
      });
    } catch (err) {
      console.error(err);
      message.reply("⚠️ | Something went wrong while processing your request.");
    }
  }
};
