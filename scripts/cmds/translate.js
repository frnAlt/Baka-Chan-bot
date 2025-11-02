const axios = require("axios");

const defaultEmojiTranslate = "🌐";
const defaultLang = "bn"; // Bangla by default
const banglishLang = "bn-Latn"; // Bangla in Latin script

module.exports = {
  config: {
    name: "spytranslate",
    aliases: ["trans", "t"],
    version: "2.0",
    author: "Farhan",
    countDown: 5,
    role: 0,
    description: {
      en: "Translate text to Banglish (default) or any language you select",
      bn: "টেক্সটকে ডিফল্টভাবে বাংলা (Banglish) বা আপনার পছন্দের ভাষায় অনুবাদ করুন"
    },
    category: "utility",
    guide: {
      en: "{p} <text> -> <ISO 639-1>: Translate text (default Banglish)\nReply to a message to translate it\nUse {p} -r [on|off] to enable reaction translation",
      bn: "{p} <টেক্সট> -> <ISO 639-1>: টেক্সট অনুবাদ করুন (ডিফল্ট Banglish)\nমেসেজের উত্তর দিয়ে অনুবাদ করতে পারেন\n{p} -r [on|off] দিয়ে রিয়্যাকশন অনুবাদ চালু/বন্ধ করুন"
    }
  },

  langs: {
    en: {
      translateTo: "🌐 Translate from %1 to %2",
      invalidArgument: "❌ Invalid argument, please choose on or off",
      turnOnTransWhenReaction: `✅ Reaction translation enabled! React with "${defaultEmojiTranslate}" to translate messages.`,
      turnOffTransWhenReaction: "✅ Reaction translation disabled",
      inputEmoji: `🌀 React to this message to set that emoji for translation`,
      emojiSet: "✅ Translation emoji set to %1"
    },
    bn: {
      translateTo: "🌐 %1 থেকে %2 তে অনুবাদ",
      invalidArgument: "❌ ভুল আর্গুমেন্ট, অনুগ্রহ করে on বা off নির্বাচন করুন",
      turnOnTransWhenReaction: `✅ রিয়্যাকশন অনুবাদ চালু হয়েছে! "${defaultEmojiTranslate}" দিয়ে মেসেজে রিয়্যাক্ট করুন।`,
      turnOffTransWhenReaction: "✅ রিয়্যাকশন অনুবাদ বন্ধ হয়েছে",
      inputEmoji: `🌀 অনুবাদের জন্য এই মেসেজে রিয়্যাক্ট করুন`,
      emojiSet: "✅ অনুবাদের ইমোজি %1 এ সেট হয়েছে"
    }
  },

  onStart: async function({ message, event, args, threadsData, getLang, commandName }) {
    // Reaction setup
    if (["-r", "-react", "-reaction"].includes(args[0])) {
      if (args[1] === "set") {
        return message.reply(getLang("inputEmoji"), (err, info) => 
          global.GoatBot.onReaction.set(info.messageID, {
            type: "setEmoji",
            commandName,
            messageID: info.messageID,
            authorID: event.senderID
          })
        );
      }
      const isEnable = args[1] === "on" ? true : args[1] === "off" ? false : null;
      if (isEnable === null) return message.reply(getLang("invalidArgument"));
      await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");
      return message.reply(isEnable ? getLang("turnOnTransWhenReaction") : getLang("turnOffTransWhenReaction"));
    }

    // Determine content
    let content = event.messageReply ? event.messageReply.body : event.body;
    if (!content) return message.SyntaxError();

    // Determine target language
    let langCode = defaultLang; // Banglish by default
    const lastArrow = content.lastIndexOf("->") !== -1 ? content.lastIndexOf("->") : content.lastIndexOf("=>");
    if (lastArrow !== -1) {
      langCode = content.slice(lastArrow + 2).trim();
      content = content.slice(0, lastArrow).trim();
    }

    // Translate
    translateAndSendMessage(content, langCode, message, getLang);
  },

  onChat: async ({ event, threadsData }) => {
    if (!await threadsData.get(event.threadID, "data.translate.autoTranslateWhenReaction")) return;
    global.GoatBot.onReaction.set(event.messageID, {
      commandName: "spytranslate",
      messageID: event.messageID,
      body: event.body,
      type: "translate"
    });
  },

  onReaction: async ({ message, Reaction, event, threadsData, getLang }) => {
    switch (Reaction.type) {
      case "setEmoji":
        if (event.userID !== Reaction.authorID) return;
        const emoji = event.reaction;
        if (!emoji) return;
        await threadsData.set(event.threadID, emoji, "data.translate.emojiTranslate");
        return message.reply(getLang("emojiSet", emoji), () => message.unsend(Reaction.messageID));
      case "translate":
        const emojiTrans = await threadsData.get(event.threadID, "data.translate.emojiTranslate") || defaultEmojiTranslate;
        if (event.reaction === emojiTrans) {
          const langCode = await threadsData.get(event.threadID, "data.lang") || defaultLang;
          const content = Reaction.body;
          Reaction.delete();
          translateAndSendMessage(content, langCode, message, getLang);
        }
    }
  }
};

// Use LibreTranslate free API
async function translate(text, langCode) {
  try {
    const res = await axios.post(
      "https://libretranslate.de/translate",
      { q: text, source: "auto", target: langCode, format: "text" },
      { headers: { "accept": "application/json" } }
    );
    return { text: res.data.translatedText };
  } catch (err) {
    console.error("Translation error:", err);
    return { text: "❌ Failed to translate text" };
  }
}

async function translateAndSendMessage(content, langCode, message, getLang) {
  const { text } = await translate(content, langCode);
  return message.reply(`${text}\n\n${getLang("translateTo", "auto", langCode)}`);
}
