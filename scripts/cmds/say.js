!cmd install say.js const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    aliases: ["sy"],
    version: "3.7",
    author: "Farhan & MILAN",
    countDown: 1,
    role: 0,
    shortDescription: "Text-to-speech with anime, game, and language voices",
    longDescription: "Speak text in anime voices or natural languages (Bangla, Hindi, English, Banglish)",
    category: "Fun",
    guide: {
      en: "{pn} <voice/language> <text>\nExamples:\n• {pn} goku Kamehameha!\n• {pn} bn কেমন আছেন?\n• {pn} hi Namaste dost!\n• {pn} en Hello world\n• {pn} hi",
    },
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) return message.reply("⚠️ Please provide text to say.\nExample: !say hello world");

    // Parse voice and text
    let voice = args[0].toLowerCase();
    let text = args.slice(1).join(" ");
    if (!text) {
      text = voice;
      voice = "en"; // default to English if only text is given
    }

    // 🎭 Custom anime/game character voices
    const characterVoices = {
      aizen: "Brian",
      goku: "Joey",
      naruto: "Justin",
      vegeta: "Matthew",
      saitama: "Russell",
      luffy: "Arthur",
      gojo: "George",
      tanjiro: "Kevin",
      mikasa: "Kimberly",
      pikachu: "Emma",
      batman: "Brian",
      spongebob: "Ivy",
    };

    // 🌍 Language voice map
    const languageVoices = {
      en: "en",
      english: "en",
      hi: "hi",
      hindi: "hi",
      bn: "bn",
      bangla: "bn",
      banglish: "en-US", // Banglish (English accent)
      bg: "bn", // shorthand
    };

    try {
      let audioUrl;

      // 🎙️ If anime/game character selected
      if (characterVoices[voice]) {
        const v = characterVoices[voice];
        audioUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${v}&text=${encodeURIComponent(text)}`;

      // 🌐 If using HuggingFace model
      } else if (voice.startsWith("hf:")) {
        const model = voice.replace("hf:", "");
        const res = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          { inputs: text },
          { headers: { "Accept": "audio/mpeg" }, responseType: "arraybuffer" }
        );
        if (res.status === 200) {
          const buffer = Buffer.from(res.data, "binary");
          return message.reply({ body: `🎙️ ${voice} says:`, attachment: buffer });
        }

      // 🌏 If a supported language is selected
      } else if (languageVoices[voice]) {
        const lang = languageVoices[voice];
        const say = encodeURIComponent(text);
        audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${say}`;

      // ⚙️ Fallback to English
      } else {
        const say = encodeURIComponent(`${voice} ${text}`);
        audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${say}`;
        voice = "en";
      }

      if (!audioUrl) return message.reply("❌ Voice generation failed.");

      const audioStream = await global.utils.getStreamFromURL(audioUrl);
      return message.reply({
        body: `🎙️ ${voice.toUpperCase()} says:`,
        attachment: audioStream,
      });

    } catch (err) {
      console.error("TTS Error:", err);
      message.reply("❌ Failed to generate voice. Try another one or check internet connection.");
    }
  },
};
