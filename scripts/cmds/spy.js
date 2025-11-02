const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami", "atake"],
    version: "1.0",
    role: 0,
    author: "Farhan",
    description: "Get Messenger user info and profile photo using free API",
    category: "information",
    countDown: 10,
  },

  onStart: async function ({ event, message, api, args }) {
    try {
      // Determine target UID
      let uid;
      const uid2 = Object.keys(event.mentions || {})[0];

      if (args[0]) {
        // Direct numeric UID
        if (/^\d+$/.test(args[0])) uid = args[0];
        // Profile URL format
        else {
          const match = args[0].match(/profile\.php\?id=(\d+)/);
          if (match) uid = match[1];
        }
      }

      // Fallback: reply or mention
      if (!uid) uid = event.messageReply?.senderID || uid2 || event.senderID;

      // --- Free API: Facebook Graph profile picture ---
      const userData = await api.getUserInfo(uid);
      const profilePic = `https://graph.facebook.com/${uid}/picture?type=large`;

      const genderMap = { 1: "Girl", 2: "Boy" };
      const genderText = genderMap[userData[uid].gender] || "Unknown";

      const name = userData[uid].name || "Unknown";
      const username = userData[uid].vanity || "None";
      const profileUrl = userData[uid].profileUrl || `https://facebook.com/${uid}`;

      // --- Compose message ---
      const infoMessage = `
╭───[ USER INFO ]
├ Name: ${name}
├ Gender: ${genderText}
├ UID: ${uid}
├ Username: ${username}
├ Profile URL: ${profileUrl}
╰ Profile Photo attached
      `;

      // Send message with profile photo
      await message.reply({
        body: infoMessage,
        attachment: await global.utils.getStreamFromURL(profilePic),
      });
    } catch (err) {
      console.error("spy error:", err);
      message.reply("❌ Failed to fetch user info. Maybe UID is invalid or API unreachable.");
    }
  },
};
