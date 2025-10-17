const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "gcinfo",
  version: "1.2.0",
  hasPermssion: 1,
  credits: "Farhan",
  description: "Shows detailed group information",
  commandCategory: "box chat",
  usages: "gcinfo",
  cooldowns: 3,
  dependencies: ["axios"]
};

module.exports.run = async function ({ api, event }) {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const memberCount = threadInfo.participantIDs.length;

    // Count genders
    let males = 0, females = 0, unknown = 0;
    if (threadInfo.userInfo && Array.isArray(threadInfo.userInfo)) {
      for (let user of threadInfo.userInfo) {
        if (user.gender === "MALE") males++;
        else if (user.gender === "FEMALE") females++;
        else unknown++;
      }
    } else {
      unknown = memberCount;
    }

    const admins = threadInfo.adminIDs.length;
    const messageCount = threadInfo.messageCount || 0;
    const icon = threadInfo.emoji || "None";
    const threadName = threadInfo.threadName || "Unnamed Group";
    const threadID = threadInfo.threadID;
    const approval = threadInfo.approvalMode ? "ON" : "OFF";

    const tempDir = path.join(__dirname, "cache");
    await fs.mkdir(tempDir, { recursive: true });
    const imagePath = path.join(tempDir, "group.png");

    // Download group image or use default
    const imageUrl = threadInfo.imageSrc || "https://i.imgur.com/3Q4cYxC.png";
    const response = await axios.get(encodeURI(imageUrl), { responseType: "arraybuffer" });
    await fs.writeFile(imagePath, Buffer.from(response.data, "binary"));

    // Send message with attachment
    await api.sendMessage(
      {
        body: `─── Group Information ───
• Name: ${threadName}
• ID: ${threadID}
• Approval Mode: ${approval}
• Emoji: ${icon}

─── Statistics ───
• Total Members: ${memberCount}
• Males: ${males}
• Females: ${females}
• Unknown: ${unknown}
• Admins: ${admins}
• Total Messages: ${messageCount}
──────────────────────`,
        attachment: fs.createReadStream(imagePath)
      },
      event.threadID,
      async () => {
        // Delete temp image after sending
        await fs.unlink(imagePath).catch(() => {});
      },
      event.messageID
    );

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Failed to get group info. Please try again later.", event.threadID, event.messageID);
  }
};
