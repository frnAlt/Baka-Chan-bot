const axios = require('axios');

module.exports = {
  config: {
    name: "animesearch",
    aliases: ["anime", "asrch"],
    version: "1.0",
    author: "Farhan & Hridoy API",
    role: 0,
    category: "Anime",
    description: "Search anime titles from anime-indo.lol",
    guide: {
      en: "{pn} <anime name>"
    }
  },

  onStart: async function({ api, event, args, message }) {
    const query = args.join(' ').trim();
    if (!query) return message.reply("❌ Please provide an anime name to search.");

    const apiUrl = `https://hridoy-apis.vercel.app/anime/animes?q=${encodeURIComponent(query)}&apikey=hridoyXQC`;

    try {
      message.reply(`🔎 Searching for anime: "${query}"...`);

      const response = await axios.get(apiUrl);
      const { status, data } = response.data;

      if (!status || !data || data.length === 0) {
        return message.reply("❌ No anime found for your query.");
      }

      // Build response text
      let replyText = `✅ Found ${data.length} results for "${query}":\n\n`;
      data.slice(0, 10).forEach((anime, index) => {
        replyText += `• ${index + 1}. ${anime.title}\n  🔗 ${anime.url}\n`;
      });

      message.reply(replyText);

    } catch (err) {
      console.error(err);
      message.reply("❌ Error fetching anime. Please try again later.");
    }
  }
};
