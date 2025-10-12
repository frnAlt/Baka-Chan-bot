const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pair",
    aliases: [],
    version: "1.2",
    author: "Farhan",
    countDown: 5,
    role: 0,
    shortDescription: "Pair two people randomly or custom",
    longDescription: "",
    category: "fun",
    guide: "{pn} or {pn} @User"
  },

  onStart: async function({ api, event, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    const { participantIDs } = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const nameSender = (await usersData.get(senderID)).name;

    let uid2, name2;

    // === Custom pair: user mentions someone ===
    if (Object.keys(mentions).length > 0) {
      const mentionIDs = Object.keys(mentions);
      uid2 = mentionIDs[0]; // Only take first mention
      name2 = (await usersData.get(uid2)).name;
    } 
    // === Random pair mode ===
    else {
      const listUserID = participantIDs.filter(ID => ID != botID && ID != senderID);
      uid2 = listUserID[Math.floor(Math.random() * listUserID.length)];
      name2 = (await usersData.get(uid2)).name;
    }

    const lovePercent = Math.floor(Math.random() * 101);
    const arrayTag = [
      { id: senderID, tag: nameSender },
      { id: uid2, tag: name2 }
    ];

    // === Fetch avatars + GIF in parallel ===
    try {
      const [avatar1, avatar2, gifLove] = await Promise.all([
        axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        fs.pathExists(__dirname + "/cache/giflove.png") 
          ? fs.readFile(__dirname + "/cache/giflove.png") 
          : axios.get(`https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif`, { responseType: "arraybuffer" }).then(res => {
              fs.writeFileSync(__dirname + "/cache/giflove.png", res.data);
              return res.data;
            })
      ]);

      // Write avatars to cache
      fs.writeFileSync(__dirname + "/cache/avt1.png", avatar1.data);
      fs.writeFileSync(__dirname + "/cache/avt2.png", avatar2.data);

      const attachments = [
        fs.createReadStream(__dirname + "/cache/avt1.png"),
        fs.createReadStream(__dirname + "/cache/giflove.png"),
        fs.createReadStream(__dirname + "/cache/avt2.png")
      ];

      const msg = {
        body: `🥰 Successful pairing! 💌 Wishing you both eternal happiness 💕\nDouble ratio: ${lovePercent}%\n${nameSender} 💓 ${name2}`,
        mentions: arrayTag,
        attachment: attachments
      };

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.error("Pair command error:", err);
      return api.sendMessage("❌ Error generating pair. Try again later.", threadID, messageID);
    }
  }
};
