const axios = require("axios");

module.exports = {
  config: {
    name: "omaigotto",
    aliases: ["omg", "omaigo", "animevoice"],
    version: "4.0",
    author: "Farhan",
    countDown: 1,
    role: 0,
    shortDescription: "Speak with a cute anime girl voice",
    longDescription: "Convert your text into a cute anime-girl (Omaigotto) voice using a free TTS API.",
    category: "Fun",
    guide: {
      en: "{pn} <text>\nExample:\n• {pn} Hello senpai!",
    },
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) {
      return message.reply("💬 Please provide text to speak!\nExample: !omaigotto Hello there~");
    }

    const text = args.join(" ");

    try {
      // 💖 Free voice API (StreamElements TTS)
      // It’s free and sounds anime-like with “Ivy” or “Kimberly”
      const voice = "Kimberly"; // sounds like soft female anime tone
      const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;

      const audioStream = await global.utils.getStreamFromURL(ttsUrl);

      return message.reply({
        body: `🎀 Omaigotto says:`,
        attachment: audioStream,
      });

    } catch (err) {
      console.error("Omaigotto TTS Error:", err);
      message.reply("❌ Omaigotto couldn’t speak right now, try again later!");
    }
  },
};
