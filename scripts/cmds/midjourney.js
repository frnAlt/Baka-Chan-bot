const axios = require('axios');
const { getStreamFromURL } = global.utils;
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "mj",
    aliases: ["mjt"],
    version: "2.2",
    author: "Farhan (updated for Hridoy API)",
    countDown: 10,
    longDescription: {
      en: "Generate fast AI images using Hridoy API Midjourney-style."
    },
    category: "Image Generation",
    role: 0,
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(' ').trim();
    if (!prompt) return message.reply("❌ Please provide a prompt to generate the image.");

    api.setMessageReaction("⌛", event.messageID, () => {}, true);
    message.reply("⚡ Generating your Midjourney-style images using Hridoy API. Please wait...", async (err) => {
      if (err) return console.error(err);

      try {
        // Make 4 parallel API calls for collage
        const calls = Array(4).fill(0).map(() => {
          const apiUrl = `https://hridoy-apis.vercel.app/ai-image/tex2img?prompt=${encodeURIComponent(prompt)}&model=5&apikey=hridoyXQC`;
          return axios.get(apiUrl).then(res => {
            if (!res.data.status || !res.data.result) throw new Error("Failed to generate image");
            return res.data.result;
          });
        });

        const results = await Promise.all(calls);

        // Load images
        const imageObjs = await Promise.all(results.map(url => loadImage(url)));

        // Create collage (2x2)
        const canvas = createCanvas(1024, 1024);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageObjs[0], 0, 0, 512, 512);
        ctx.drawImage(imageObjs[1], 512, 0, 512, 512);
        ctx.drawImage(imageObjs[2], 0, 512, 512, 512);
        ctx.drawImage(imageObjs[3], 512, 512, 512, 512);

        // Save locally
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        const outputPath = path.join(cacheDir, `mjt_collage_${event.senderID}.png`);
        const out = fs.createWriteStream(outputPath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", async () => {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          const msg = {
            body: "✅ Midjourney-style images generated!\n\n❏ Reply with U1, U2, U3, or U4 to select one.",
            attachment: fs.createReadStream(outputPath)
          };
          message.reply(msg, (err, info) => {
            if (err) return console.error(err);
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID,
              results
            });
          });
        });

      } catch (error) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        console.error(error.response?.data || error.message || error);
        message.reply("❌ An error occurred while generating the images. Please try again.");
      }
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, results, messageID } = Reply;
    if (event.senderID !== author) return message.reply("❌ Only the user who initiated the command can select an image.");

    const input = event.body.trim().toUpperCase();
    const match = input.match(/^U([1-4])$/);
    if (!match) return message.reply("❌ Invalid input. Please reply with U1, U2, U3, or U4 to select an image.");

    const index = parseInt(match[1]) - 1;
    const selectedImage = results[index];

    try {
      const imageStream = await getStreamFromURL(selectedImage, `mjt_selected_U${index + 1}.jpg`);
      message.reply({
        body: `✅ Here is your selected image (U${index + 1}) from Midjourney-style generation.`,
        attachment: imageStream
      });

      // Cleanup listener
      global.GoatBot.onReply.delete(messageID);

    } catch (error) {
      console.error(error);
      message.reply("❌ Unable to retrieve the selected image. Please try again.");
    }
  }
};
