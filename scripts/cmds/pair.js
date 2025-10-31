const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    aliases: ["love", "ship"],
    version: "2.0",
    author: "Farhan & GPT-5",
    countDown: 5,
    role: 0,
    shortDescription: "Pair two users with advanced effects 💞",
    longDescription: "Randomly or manually pair two users with dynamic visuals, love meter, and stylish effects.",
    category: "fun",
    guide: "{pn} or {pn} @User"
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    const { participantIDs } = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const nameSender = (await usersData.get(senderID)).name;

    let uid2, name2;

    // --- Custom pairing if user mentioned ---
    if (Object.keys(mentions).length > 0) {
      uid2 = Object.keys(mentions)[0];
      name2 = (await usersData.get(uid2)).name;
    } else {
      // --- Random pairing mode ---
      const listUserID = participantIDs.filter(ID => ID != botID && ID != senderID);
      uid2 = listUserID[Math.floor(Math.random() * listUserID.length)];
      name2 = (await usersData.get(uid2)).name;
    }

    const lovePercent = Math.floor(Math.random() * 101);
    const loveEmoji =
      lovePercent > 90 ? "💘" :
      lovePercent > 75 ? "❤️‍🔥" :
      lovePercent > 50 ? "💞" :
      lovePercent > 25 ? "💔" : "💀";

    const arrayTag = [
      { id: senderID, tag: nameSender },
      { id: uid2, tag: name2 }
    ];

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    try {
      // === Fetch avatars ===
      const [avatar1, avatar2] = await Promise.all([
        axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
      ]);

      // Write to cache
      const avt1Path = path.join(cacheDir, "avt1.png");
      const avt2Path = path.join(cacheDir, "avt2.png");
      await fs.writeFile(avt1Path, avatar1.data);
      await fs.writeFile(avt2Path, avatar2.data);

      // === Fetch dynamic couple image from API ===
      const loveCardURL = `https://api.popcat.xyz/ship?user1=https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662&user2=https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const loveCard = await axios.get(loveCardURL, { responseType: "arraybuffer" });
      const cardPath = path.join(cacheDir, "love_card.png");
      await fs.writeFile(cardPath, loveCard.data);

      // === Create message ===
      const msg = {
        body: `💞 Love Match Result 💞\n\n💑 ${nameSender} × ${name2}\n❤️ Love Percentage: ${lovePercent}% ${loveEmoji}\n\n💌 ${lovePercent > 70 ? "A match made in heaven!" : lovePercent > 40 ? "There’s some chemistry here!" : "Maybe just friends 😅"}`,
        mentions: arrayTag,
        attachment: fs.createReadStream(cardPath)
      };

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.error("Pair command error:", err);
      return api.sendMessage("❌ Failed to create love pairing. Try again later!", threadID, messageID);
    }
  }
};
