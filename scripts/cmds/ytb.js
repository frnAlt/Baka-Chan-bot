const axios = require("axios");
const fs = require("fs");

const baseApiUrl = () => "https://pipedapi.kavin.rocks";

module.exports = {
  config: {
    name: "ytb",
    version: "2.0.0",
    aliases: ["youtube"],
    author: "Farhan (Rewritten using Piped API)",
    countDown: 5,
    role: 0,
    description: {
      en: "Download video, audio, and info from YouTube (via open-source API)"
    },
    category: "media",
    guide: {
      en:
        "  {pn} [video|-v] [<video name>|<video link>]\n" +
        "  {pn} [audio|-a] [<video name>|<video link>]\n" +
        "  {pn} [info|-i] [<video name>|<video link>]\n\n" +
        "  Example:\n" +
        "  {pn} -v chipi chipi chapa chapa\n" +
        "  {pn} -a chipi chipi chapa chapa\n" +
        "  {pn} -i chipi chipi chapa chapa"
    }
  },

  onStart: async ({ api, args, event, commandName }) => {
    if (!args[0])
      return api.sendMessage("❗ Please specify an option (-v, -a, or -i)", event.threadID);

    const action = args[0].toLowerCase();
    args.shift();
    const keyword = args.join(" ");
    if (!keyword) return api.sendMessage("❗ Please provide a YouTube link or search term.", event.threadID);

    const urlRegex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|shorts\/)?([^&\n?#]+)/;
    const match = keyword.match(urlRegex);
    const isLink = !!match;
    let videoID = isLink ? match[1] : null;

    try {
      if (isLink) {
        if (action === "-i" || action === "info") {
          const info = await getVideoInfo(videoID);
          const message = formatInfo(info);
          await api.sendMessage({ body: message, attachment: await getThumbnail(info.thumbnailUrl) }, event.threadID);
        } else if (action === "-v" || action === "-a") {
          const stream = await getStream(videoID);
          const format = action === "-a" ? "audio" : "video";
          const url = action === "-a" ? stream.audioStreams[0].url : stream.videoStreams[0].url;
          const fileName = `ytb_${format}_${videoID}.${action === "-a" ? "mp3" : "mp4"}`;
          await downloadFile(url, fileName);
          await api.sendMessage(
            { body: `✅ | ${stream.title}\n📦 | Format: ${format.toUpperCase()}`, attachment: fs.createReadStream(fileName) },
            event.threadID,
            () => fs.unlinkSync(fileName)
          );
        }
        return;
      }

      // If keyword search instead of link
      const results = (await axios.get(`${baseApiUrl()}/search?q=${encodeURIComponent(keyword)}`)).data;
      if (!results.length) return api.sendMessage("❌ No results found.", event.threadID);

      const msg = results
        .slice(0, 6)
        .map((v, i) => `${i + 1}. ${v.title}\n⏳ ${v.duration} | 👀 ${v.views}\n📺 ${v.uploaderName}\n`)
        .join("\n");

      const thumbnails = await Promise.all(results.slice(0, 6).map(v => getThumbnail(v.thumbnail)));
      api.sendMessage(
        { body: msg + "\nReply with a number to choose.", attachment: thumbnails },
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            results,
            action
          });
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ Error occurred: " + err.message, event.threadID);
    }
  },

  onReply: async ({ api, event, Reply }) => {
    const { results, action } = Reply;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice <= 0 || choice > results.length)
      return api.sendMessage("❌ Invalid choice. Reply with a valid number.", event.threadID);

    const selected = results[choice - 1];
    const videoID = selected.url.split("v=")[1] || selected.url.split("/").pop();

    try {
      if (action === "-v" || action === "video") {
        const stream = await getStream(videoID);
        const fileName = `ytb_video_${videoID}.mp4`;
        await downloadFile(stream.videoStreams[0].url, fileName);
        await api.sendMessage(
          { body: `🎬 | ${stream.title}\nResolution: ${stream.videoStreams[0].quality}`, attachment: fs.createReadStream(fileName) },
          event.threadID,
          () => fs.unlinkSync(fileName)
        );
      } else if (action === "-a" || action === "audio") {
        const stream = await getStream(videoID);
        const fileName = `ytb_audio_${videoID}.mp3`;
        await downloadFile(stream.audioStreams[0].url, fileName);
        await api.sendMessage(
          { body: `🎵 | ${stream.title}\nAudio: ${stream.audioStreams[0].quality}`, attachment: fs.createReadStream(fileName) },
          event.threadID,
          () => fs.unlinkSync(fileName)
        );
      } else if (action === "-i" || action === "info") {
        const info = await getVideoInfo(videoID);
        const message = formatInfo(info);
        await api.sendMessage({ body: message, attachment: await getThumbnail(info.thumbnailUrl) }, event.threadID);
      }
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error while processing your choice: " + err.message, event.threadID);
    }
  }
};

// Helper functions
async function getStream(videoID) {
  const { data } = await axios.get(`${baseApiUrl()}/streams/${videoID}`);
  return data;
}

async function getVideoInfo(videoID) {
  const { data } = await axios.get(`${baseApiUrl()}/streams/${videoID}`);
  return {
    title: data.title,
    duration: data.duration,
    uploader: data.uploader,
    views: data.views,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate: data.uploadDate
  };
}

function formatInfo(info) {
  return (
    `🎬 Title: ${info.title}\n` +
    `🕒 Duration: ${info.duration}s\n` +
    `📺 Channel: ${info.uploader}\n` +
    `👀 Views: ${info.views}\n` +
    `📅 Uploaded: ${info.uploadDate}`
  );
}

async function downloadFile(url, pathName) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(pathName, Buffer.from(response));
  return pathName;
}

async function getThumbnail(url) {
  const response = await axios.get(url, { responseType: "stream" });
  response.data.path = "thumbnail.jpg";
  return response.data;
}
