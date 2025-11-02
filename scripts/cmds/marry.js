const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "marry",
    aliases: ["propose", "engage"],
    version: "2.0",
    author: "Farhan",
    countDown: 5,
    role: 0,
    shortDescription: "💍 Propose or marry someone!",
    longDescription: "Let your heart speak! Propose to someone in chat or let the bot pick your destined partner randomly.",
    category: "fun",
    guide: "{pn} @User — to propose someone\n{pn} — to marry someone random"
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    const { participantIDs } = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const nameSender = (await usersData.get(senderID)).name;

    let uid2, name2;

    // === Mentioned Proposal ===
    if (Object.keys(mentions).length > 0) {
      uid2 = Object.keys(mentions)[0];
      name2 = (await usersData.get(uid2)).name;
    } else {
      // === Random Marriage Partner ===
      const listUserID = participantIDs.filter(ID => ID != botID && ID != senderID);
      uid2 = listUserID[Math.floor(Math.random() * listUserID.length)];
      name2 = (await usersData.get(uid2)).name;
    }

    // === Love & Marriage Meter ===
    const lovePercent = Math.floor(Math.random() * 101);
    const emoji =
      lovePercent > 90 ? "💞💍" :
      lovePercent > 75 ? "❤️💫" :
      lovePercent > 50 ? "💘" :
      lovePercent > 30 ? "💔" : "💀";

    const tagArray = [
      { id: senderID, tag: nameSender },
      { id: uid2, tag: name2 }
    ];

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    try {
      // === Fetch profile pictures ===
      const [avatar1, avatar2] = await Promise.all([
        axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
      ]);

      // Write avatars
      const avt1Path = path.join(cacheDir, "marry1.png");
      const avt2Path = path.join(cacheDir, "marry2.png");
      await fs.writeFile(avt1Path, avatar1.data);
      await fs.writeFile(avt2Path, avatar2.data);

      // === Generate Couple Image (Popcat API or new one) ===
      const marryCardURL = `https://api.popcat.xyz/ship?user1=https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&user2=https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const marryCard = await axios.get(marryCardURL, { responseType: "arraybuffer" });
      const marryPath = path.join(cacheDir, "marry_card.png");
      await fs.writeFile(marryPath, marryCard.data);

      // === Marriage Result Message ===
      const cuteQuotes = [
        "💖 True love stories never have endings.",
        "💞 You are my today and all of my tomorrows.",
        "💍 Two souls, one heart.",
        "💫 Forever starts with you.",
        "💝 Love is not about how many days you’ve been together, but how much you love each other every day."
      ];
      const quote = cuteQuotes[Math.floor(Math.random() * cuteQuotes.length)];

      const msg = {
        body: `💍💖 *Marriage Proposal Result* 💖💍\n\n👩‍❤️‍👨 ${nameSender} wants to marry ${name2}!\n💌 Love Compatibility: ${lovePercent}% ${emoji}\n\n${quote}\n\n${lovePercent > 70 ? "💞 Congratulations! You’re now officially engaged! 🎉" : "😅 Maybe next time… destiny might change."}`,
        mentions: tagArray,
        attachment: fs.createReadStream(marryPath)
      };

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.error("💔 Marry command error:", err);
      return api.sendMessage("❌ Unable to process your proposal. Try again later!", threadID, messageID);
    }
  }
};
          
