const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "github",
    version: "1.1.0",
    author: "frnwot",
    countDown: 5,
    prefix: true,
    groupAdminOnly: false,
    description: "Fetches GitHub user details for a given username.",
    category: "media",
    guide: "{pn} github <username>"
  },
  langs: {
    en: {
      missingUsername: "⚠️ Please provide a GitHub username.\nUsage: {pn}github <username>",
      userNotFound: "❌ Failed to fetch GitHub user details. User not found or API error.",
      fetching: "⏳ Fetching GitHub user details..."
    }
  },
  onStart: async function({ api, event, args, getLang }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(getLang("missingUsername").replace("{pn}", this.config.name), threadID, messageID);
    }

    const username = args[0].trim();
    const apiUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;  // official endpoint :contentReference[oaicite:1]{index=1}

    const tempDir = path.join(__dirname, "../../temp");
    const filePath = path.join(tempDir, `github_${username}.png`);

    try {
      await fs.ensureDir(tempDir);

      const waitMsg = await api.sendMessage(getLang("fetching").replace("{pn}", this.config.name), threadID, messageID);

      const response = await axios.get(apiUrl, {
        headers: { "Accept": "application/vnd.github+json" }
      });
      const user = response.data;

      if (!user || !user.login) {
        await api.unsendMessage(waitMsg.messageID);
        return api.sendMessage(getLang("userNotFound"), threadID, messageID);
      }

      // Download avatar
      const avatarResponse = await axios.get(user.avatar_url, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, avatarResponse.data);

      // Construct message details
      const details = [
        `╔═━─[ GitHub User ]─━═╗`,
        `┃ Username: ${user.login}`,
        `┃ Name: ${user.name || "Not set"}`,
        `┃ Bio: ${user.bio || "Not set"}`,
        `┃ Company: ${user.company || "Not set"}`,
        `┃ Location: ${user.location || "Not set"}`,
        `┃ Followers: ${user.followers}`,
        `┃ Following: ${user.following}`,
        `┃ Public Repos: ${user.public_repos}`,
        `┃ Profile: ${user.html_url}`,
        `╚═━───────────────────═╝`
      ].join("\n");

      await api.sendMessage(
        {
          body: details,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => {
          fs.unlink(filePath).catch(() => {});
        },
        messageID
      );

      await api.unsendMessage(waitMsg.messageID);

    } catch (err) {
      console.error("Error fetching GitHub user:", err);
      await api.sendMessage(getLang("userNotFound"), threadID, messageID);
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath).catch(() => {});
      }
    }
  }
};
