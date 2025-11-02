const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'sing',
    version: '1.1',
    author: 'Farhan',
    countDown: 5,
    prefix: true,
    description: 'Search and play music from YouTube, auto selects most viewed. Use -v for video.',
    category: 'media',
    guide: { en: '{pn}sing <music name> or {pn}sing -v <music name>' }
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!args.length) {
      return api.sendMessage('❌ Please provide a music name. Example: sing Starboy', threadID, messageID);
    }

    // Check for -v flag
    const isVideo = args[0] === '-v';
    const query = isVideo ? args.slice(1).join(' ').trim() : args.join(' ').trim();

    if (!query) {
      return api.sendMessage('❌ Please provide a music name after the flag.', threadID, messageID);
    }

    let statusMsg;
    try {
      statusMsg = await new Promise((resolve, reject) => {
        api.sendMessage('🔎 Searching the music...', threadID, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        }, messageID);
      });

      // Search YouTube
      const searchRes = await axios.get(`https://hridoy-apis.vercel.app/search/youtube?query=${encodeURIComponent(query)}&count=5&apikey=hridoyXQC`);
      const results = searchRes.data?.result;
      if (!Array.isArray(results) || !results.length) {
        await api.editMessage('❌ No music found.', statusMsg.messageID);
        return;
      }

      // Select most viewed
      let mostViewed = results[0];
      for (const vid of results) if (vid.views > mostViewed.views) mostViewed = vid;

      await api.editMessage('⬇️ Downloading...', statusMsg.messageID);

      // Get download link (mp3 or mp4)
      const format = isVideo ? 'mp4' : 'mp3';
      const dlRes = await axios.get(`https://hridoy-apis.vercel.app/downloader/ytmp4?url=${encodeURIComponent(mostViewed.url)}&format=${format}&apikey=hridoyXQC`);
      const downloadUrl = dlRes.data?.result?.download;
      const musicTitle = dlRes.data?.result?.title || mostViewed.title;
      const musicAuthor = mostViewed.author;
      const views = mostViewed.views?.toLocaleString?.() || mostViewed.views || 'N/A';

      if (!downloadUrl) {
        await api.editMessage('❌ Failed to get download link.', statusMsg.messageID);
        return;
      }

      await api.editMessage('📤 Sending...', statusMsg.messageID);

      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `sing_${Date.now()}.${format}`);

      const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 60000 });
      await fs.writeFile(filePath, Buffer.from(audioRes.data));

      await new Promise((resolve, reject) => {
        api.sendMessage({
          body: `🎶 ${musicTitle}\n👤 Author: ${musicAuthor}\n👁️ Views: ${views}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, (err) => {
          fs.unlink(filePath).catch(() => {});
          if (err) reject(err);
          else resolve();
        }, messageID);
      });

      if (statusMsg?.messageID) await api.unsendMessage(statusMsg.messageID);

    } catch (error) {
      console.error('[sing] Error:', error);
      if (statusMsg?.messageID) {
        await api.editMessage('❌ Error occurred while processing your request.', statusMsg.messageID);
        setTimeout(() => api.unsendMessage(statusMsg.messageID), 10000);
      } else {
        api.sendMessage('❌ Error occurred while processing your request.', threadID, messageID);
      }
    }
  }
};
