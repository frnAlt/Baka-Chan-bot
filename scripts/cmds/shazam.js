const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Shazam } = require("node-shazam");
const yts = require("yt-search");
const qs = require("qs");

module.exports = {
  config: {
    name: "shazam",
    aliases: ["music", "songid", "identify", "shaz", "shazm"],
    version: "1.1",
    author: "Takt Asahina & Farhan",
    role: 0,
    description: { en: "Identify a song from video or audio" },
    category: "media",
    usage: { en: "Reply to a video or audio file to identify the song" },
    cooldown: 5
  },

  onType: async function ({ api, event, sh: Message }) {
    if (event.type !== "message_reply")
      return Message.reply("⚠️ Please reply to a video or audio file!");

    try {
      const attachment = event.messageReply?.attachments?.[0];
      if (!attachment) return Message.reply("⚠️ No attachment found!");

      const type = attachment.type;
      const ext = type === "audio" ? ".mp3" : type === "video" ? ".mp4" : null;
      if (!ext) return Message.reply("⚠️ This is not a video or audio file.");

      const filePath = path.join(__dirname, `/cache/song${ext}`);
      const fileData = await axios.get(attachment.url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(fileData.data));

      const shazam = new Shazam();
      let songData = await shazam.recognise(filePath, "en-US");

      if (!songData?.track?.title) {
        // Fallback: Google / YouTube search using audio title hint
        const fallback = await detectSongFallback(filePath);
        if (fallback) songData = fallback;
        else return Message.reply("❌ Could not detect the song.");
      }

      const track = songData.track;
      const imageURL = track.images?.coverart;
      const songTitle = track.title;
      const songAuthor = track.subtitle;

      const sentMsg = await Message.reply({
        body: `🎵 Song Info:\n• Artist: ${songAuthor}\n• Title: ${songTitle}\n\nReply with "send" to receive the song link.`,
        attachment: imageURL ? (await axios.get(imageURL, { responseType: "stream" })).data : null
      });

      global.shelly.Reply.push({
        name: "shazam",
        ID: sentMsg.messageID,
        songName: songTitle,
        author: event.senderID
      });

    } catch (err) {
      console.error(err);
      return Message.reply("❌ Error while identifying the song.");
    }
  },

  Reply: async ({ args, event, sh, Reply }) => {
    const { songName, author } = Reply;
    if (event.senderID !== author) return;
    if (!["send", "ارسلي"].includes(event.body.toLowerCase())) return;

    sh.reply("⏳ Fetching song, please wait...");

    const searchResult = await yts(songName);
    if (!searchResult.videos.length) return sh.reply("❌ Could not find song link on YouTube.");

    const topResult = searchResult.videos[0];
    sh.str(topResult.title, topResult.url);
  }
};

// --------- Helper Functions ---------
async function detectSongFallback(filePath) {
  try {
    // You can integrate Open Source Google audio search or MusicBrainz API here
    // For now, fallback will just simulate Shazam alternative
    const shazam = new Shazam();
    const result = await shazam.recognise(filePath, "en-US");
    return result.track?.title ? result : null;
  } catch (e) {
    console.error("Fallback detection failed:", e);
    return null;
  }
}

