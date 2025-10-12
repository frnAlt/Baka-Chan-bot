const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    aliases: ["sy", "tts"],
    version: "4.5",
    author: "Farhan & Milan",
    countDown: 1,
    role: 0,
    shortDescription: "Speak text with anime, celebrity, or random voices",
    longDescription: "Text-to-speech using anime, game, famous, or random voices. You can also type any voice name if it exists on StreamElements.",
    category: "Fun",
    guide: {
      en: `{pn} <voice> <text>
Examples:
• {pn} goku Kamehameha!
• {pn} trump Make America great again!
• {pn} Hello there (random voice)
• {pn} hf:facebook/mms-tts-eng Hi!`
    },
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) return message.reply("⚠️ Please enter text or a voice with text.");

    let voice = args[0].toLowerCase();
    let text = args.slice(1).join(" ");

    // If user didn’t specify a voice (e.g., "!say Hello")
    if (!text) {
      text = voice;
      voice = "random"; // use random voice system
    }

    try {
      let audioUrl;

      // 🎭 Full list of character & celebrity voices
      const characterVoices = {
        // 🦸 Anime & Game
        goku: "Joey",
        vegeta: "Matthew",
        naruto: "Justin",
        sasuke: "Russell",
        luffy: "Arthur",
        zoro: "Brian",
        sanji: "Joey",
        gojo: "George",
        itachi: "Matthew",
        tanjiro: "Kevin",
        nezuko: "Kimberly",
        mikasa: "Emma",
        eren: "Joey",
        levi: "Russell",
        saitama: "Brian",
        bulma: "Salli",
        hinata: "Kimberly",
        sakura: "Emma",
        nami: "Joanna",
        rem: "Salli",
        zero_two: "Kimberly",

        // 🧍 Famous People
        trump: "Brian",
        obama: "Matthew",
        elon: "Joey",
        musk: "Joey",
        modi: "Russell",
        sheikh: "Matthew",
        hasina: "Kimberly",
        mujib: "George",
        biden: "Brian",
        putin: "Matthew",
        taylor: "Salli",
        selena: "Kimberly",
        billgates: "George",
        mark: "Russell",
        zuckerberg: "Russell",
        drake: "George",
        messi: "Arthur",
        ronaldo: "Matthew",

        // 🧙 Fun extras
        batman: "Brian",
        spiderman: "Joey",
        spongebob: "Ivy",
        pikachu: "Emma",
        joker: "Russell",
        thanos: "Brian",
      };

      // 🎲 Random voice pick if user didn’t choose any
      const availableVoices = Object.keys(characterVoices);
      if (voice === "random") {
        const randomKey = availableVoices[Math.floor(Math.random() * availableVoices.length)];
        voice = randomKey;
        message.reply(`🎲 Random voice selected: ${randomKey.toUpperCase()}`);
      }

      // 🟢 If predefined character
      if (characterVoices[voice]) {
        const v = characterVoices[voice];
        audioUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${v}&text=${encodeURIComponent(text)}`;
      }

      // 🟣 HuggingFace model option (hf:model-name)
      else if (voice.startsWith("hf:")) {
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
      }

      // 🟡 Custom StreamElements voice (if user types any valid one)
      else {
        audioUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;
      }

      if (!audioUrl) return message.reply("❌ Voice generation failed.");

      const audioStream = await global.utils.getStreamFromURL(audioUrl);
      return message.reply({
        body: `🎙️ ${voice.toUpperCase()} says:`,
        attachment: audioStream,
      });
    } catch (err) {
      console.error("TTS Error:", err);
      message.reply("❌ Failed to generate voice. Try another one.");
    }
  },
};
