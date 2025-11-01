const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    aliases: [],
    version: "1.3",
    author: "Farhan",
    countDown: 5,
    role: 0,
    shortDescription: "Pair two people randomly or custom",
    longDescription: "Pairs two users and generates a love-style image with logo & heart overlay.",
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
    } else {
      // === Random pair mode ===
      const listUserID = participantIDs.filter(ID => ID != botID && ID != senderID);
      uid2 = listUserID[Math.floor(Math.random() * listUserID.length)];
      name2 = (await usersData.get(uid2)).name;
    }

    const lovePercent = Math.floor(Math.random() * 101);
    const arrayTag = [
      { id: senderID, tag: nameSender },
      { id: uid2, tag: name2 }
    ];

    try {
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const [avatar1, avatar2, heartGif, logo] = await Promise.all([
        axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif`, { responseType: "arraybuffer" }),
        axios.get(`https://i.ibb.co/yybHj6h/love-logo.png`, { responseType: "arraybuffer" }) // ❤️ your PNG logo overlay
      ]);

      // Save temp images
      const avt1Path = path.join(cacheDir, "avt1.png");
      const avt2Path = path.join(cacheDir, "avt2.png");
      const logoPath = path.join(cacheDir, "logo.png");
      fs.writeFileSync(avt1Path, avatar1.data);
      fs.writeFileSync(avt2Path, avatar2.data);
      fs.writeFileSync(logoPath, logo.data);

      // === Compose final image ===
      const canvas = createCanvas(1100, 600);
      const ctx = canvas.getContext("2d");

      // background color
      ctx.fillStyle = "#ffecf2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // load images
      const [img1, img2, logoImg] = await Promise.all([
        loadImage(avt1Path),
        loadImage(avt2Path),
        loadImage(logoPath)
      ]);

      // circular avatars
      ctx.save();
      ctx.beginPath();
      ctx.arc(275, 300, 200, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img1, 75, 100, 400, 400);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(825, 300, 200, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img2, 625, 100, 400, 400);
      ctx.restore();

      // Heart/logo overlay
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logoImg, 475, 200, 150, 150);
      ctx.globalAlpha = 1;

      // Texts
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#e91e63";
      ctx.textAlign = "center";
      ctx.fillText(`${lovePercent}% Love Match ❤️`, 550, 550);

      const finalPath = path.join(cacheDir, `pair_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(finalPath, buffer);

      const attachments = [fs.createReadStream(finalPath)];

      const msg = {
        body: `🥰 Pairing complete!\n💞 ${nameSender} × ${name2}\n💘 Love ratio: ${lovePercent}%`,
        mentions: arrayTag,
        attachment: attachments
      };

      api.sendMessage(msg, threadID, () => {
        // Cleanup cache
        [avt1Path, avt2Path, logoPath, finalPath].forEach(f => fs.unlink(f).catch(() => {}));
      }, messageID);

    } catch (err) {
      console.error("Pair command error:", err);
      return api.sendMessage("❌ Error generating pair image. Try again later.", threadID, messageID);
    }
  }
};
