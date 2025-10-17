const Canvas = require("canvas");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "customphoto",
    aliases: ["cpic"],
    version: "1.0",
    author: "Farhan",
    countDown: 5,
    role: 0,
    shortDescription: "Create custom photo with avatar",
    longDescription: "Overlay user profile picture on a custom template",
    category: "image",
    guide: {
      en: "{pn} @tag [templateURL]"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người muốn tạo ảnh",
      noTemplate: "Bạn phải cung cấp URL template"
    },
    en: {
      noTag: "You must tag someone to create the photo",
      noTemplate: "You must provide a template URL"
    }
  },

  onStart: async function({ event, message, usersData, args, getLang }) {
    try {
      let targetID;
      if (event.type === "message_reply") targetID = event.messageReply.senderID;
      else targetID = Object.keys(event.mentions)[0] || event.senderID;

      // Avatar URL
      const avatarURL = await usersData.getAvatarUrl(targetID);

      // Template URL from args
      const templateURL = args.find(arg => arg.startsWith("http"));
      if (!templateURL) return message.reply(getLang("noTemplate"));

      // Load images
      const [avatar, template] = await Promise.all([
        Canvas.loadImage(avatarURL),
        Canvas.loadImage(templateURL)
      ]);

      // Create canvas
      const canvas = Canvas.createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      // Draw template
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

      // Draw avatar as circle
      const avatarSize = Math.min(canvas.width, canvas.height) / 3;
      const avatarX = canvas.width / 2 - avatarSize / 2;
      const avatarY = canvas.height / 2 - avatarSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Send image
      const buffer = canvas.toBuffer();
      return message.reply({ body: "", attachment: buffer });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to create custom photo.");
    }
  }
};
        
