const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    aliases: ["tts", "voice"],
    version: "2.0",
    author: "MILAN & Farhan",
    countDown: 1,
    role: 0,
    shortDescription: "Text-to-speech with character or language voices",
    longDescription: "",
    category: "Fun",
    guide: {
      en: "{pn} <voice/lang> <text>\nExample:\n• {pn} en Hello world\n• {pn} goku Kamehameha!"
    },
  },

  onStart: async function ({ api, message, args, event }) {
    if (!args[0]) return message.reply("⚠️ Please enter a voice or text.");

    let voice = args[0].toLowerCase();
    let text = args.slice(1).join(" ");

    if (!text) {
      text = voice;
      voice = "en";
    }

    try {
      let audioUrl;

      // ✅ Detect if user used a known character name
      const characterVoices = [
        "goku", "spongebob", "batman", "mario", "pikachu",
        "obama", "trump", "sonic", "walterwhite", "megumin"
      ];

      if (characterVoices.includes(voice)) {
        // 🟢 Uberduck TTS API for character voices
        const res = await axios.post(
          "https://api.uberduck.ai/speak-synchronous",
          { speech: text, voice },
          { auth: { username: "anonymous", password: "anonymous" } }
        );
        audioUrl = res.data.path;
      } else {
        // 🟡 Fallback to Google Translate TTS for normal languages
        const say = encodeURIComponent(text);
        audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${voice}&client=tw-ob&q=${say}`;
      }

      if (!audioUrl) return message.reply("❌ Voice generation failed.");

      const audioStream = await global.utils.getStreamFromURL(audioUrl);
      return message.reply({ body: `🎙️ ${voice} says:`, attachment: audioStream });

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to generate voice. Try another one.");
    }
  },
};
