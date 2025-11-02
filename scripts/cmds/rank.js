const Canvas = require("canvas");
const { randomString } = global.utils;

Canvas.registerFont(`${__dirname}/assets/font/BeVietnamPro-SemiBold.ttf`, {
  family: "BeVietnamPro-SemiBold",
});
Canvas.registerFont(`${__dirname}/assets/font/BeVietnamPro-Bold.ttf`, {
  family: "BeVietnamPro-Bold",
});

let deltaNext;
global.client.makeRankCard = makeRankCard;

module.exports = {
  config: {
    name: "rank",
    version: "3.0",
    author: "Farhan & NTKhang",
    countDown: 5,
    role: 0,
    description: {
      vi: "Xem level của bạn hoặc người được tag. Hỗ trợ tag nhiều người",
      en: "View your level or someone tagged. Multi-tag supported",
    },
    category: "rank",
    guide: {
      vi: "{pn} [trống | @tags]",
      en: "{pn} [empty | @tags]",
    },
    envConfig: {
      deltaNext: 5,
    },
  },

  onStart: async function ({ message, event, usersData, threadsData, commandName, envCommands, api }) {
    deltaNext = envCommands[commandName].deltaNext;

    const targets = Object.keys(event.mentions).length ? Object.keys(event.mentions) : [event.senderID];
    const rankCards = await Promise.all(
      targets.map(async userID => {
        const rankCard = await makeRankCard(userID, usersData, threadsData, event.threadID, deltaNext, api);
        rankCard.path = `${randomString(10)}.png`;
        return rankCard;
      })
    );

    return message.reply({ attachment: rankCards });
  },

  onChat: async ({ usersData, event }) => {
    let { exp } = await usersData.get(event.senderID);
    if (isNaN(exp)) exp = 0;
    await usersData.set(event.senderID, { exp: exp + 1 });
  },
};

// ----------------------------
// Core Rank Logic
// ----------------------------
const expToLevel = (exp, deltaNextLevel) =>
  Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);

const levelToExp = (level, deltaNextLevel) =>
  Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);

const defaultDesignCard = {
  width: 1200,
  height: 400,
  backgroundColor: "#1b1b1b",
  overlayColor: "rgba(0,0,0,0.6)",
  barGradient: ["#FFD700", "#FF8C00"],
  barBackground: "#555",
  textGradient: ["#ffffff", "#ffeb3b"],
  font: "BeVietnamPro-Bold",
  emoji: {
    level: "⭐",
    rank: "🏆",
    exp: "⚡",
  },
};

// ----------------------------
// Build Rank Card
// ----------------------------
async function makeRankCard(userID, usersData, threadsData, threadID, deltaNext, api) {
  const userData = await usersData.get(userID);
  const level = expToLevel(userData.exp, deltaNext);
  const expNext = levelToExp(level + 1, deltaNext) - levelToExp(level, deltaNext);
  const currentExp = userData.exp - levelToExp(level, deltaNext);

  const allUsers = await usersData.getAll();
  allUsers.sort((a, b) => b.exp - a.exp);
  const rank = allUsers.findIndex(u => u.userID === userID) + 1;

  const threadSettings = await threadsData.get(threadID, "data.customRankCard") || {};
  const config = { ...defaultDesignCard, ...threadSettings };

  return buildModernRankCard({
    ...config,
    avatar: await usersData.getAvatarUrl(userID),
    name: userData.name,
    level,
    rank,
    currentExp,
    expNext,
  });
}

// ----------------------------
// Modern card builder
// ----------------------------
async function buildModernRankCard(options) {
  const {
    width, height, backgroundColor, overlayColor,
    barGradient, barBackground, textGradient, font,
    avatar, name, level, rank, currentExp, expNext, emoji
  } = options;

  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Overlay with soft shadow
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 30;
  ctx.fillStyle = overlayColor;
  ctx.roundRect(20, 20, width - 40, height - 40, 40).fill();
  ctx.shadowBlur = 0;

  // Draw circular avatar
  const avatarImg = await Canvas.loadImage(avatar);
  const avatarSize = height - 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(60 + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, 40, 40, avatarSize, avatarSize);
  ctx.restore();

  // XP Bar
  const barX = 120 + avatarSize;
  const barY = height - 100;
  const barWidth = width - 180 - avatarSize;
  const barHeight = 40;

  // Background bar
  ctx.fillStyle = barBackground;
  ctx.roundRect(barX, barY, barWidth, barHeight, 20).fill();

  // Fill with gradient
  const progress = currentExp / expNext;
  const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  grad.addColorStop(0, barGradient[0]);
  grad.addColorStop(1, barGradient[1]);
  ctx.fillStyle = grad;
  ctx.roundRect(barX, barY, barWidth * progress, barHeight, 20).fill();

  // Text gradients
  const textGrad = ctx.createLinearGradient(barX, 0, barX + 300, 0);
  textGrad.addColorStop(0, textGradient[0]);
  textGrad.addColorStop(1, textGradient[1]);
  ctx.fillStyle = textGrad;
  ctx.font = `48px ${font}`;
  ctx.fillText(`${emoji.level} ${name}`, barX, 80);
  ctx.fillText(`${emoji.level} Level: ${level}`, barX, 160);
  ctx.fillText(`${emoji.rank} Rank: #${rank}`, barX, 240);
  ctx.fillText(`${emoji.exp} XP: ${currentExp}/${expNext}`, barX, barY + 30);

  return canvas.toBuffer();
}

// Helper for rounded rectangles
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  this.beginPath();
  this.moveTo(x + r, y);
  this.lineTo(x + w - r, y);
  this.quadraticCurveTo(x + w, y, x + w, y + r);
  this.lineTo(x + w, y + h - r);
  this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  this.lineTo(x + r, y + h);
  this.quadraticCurveTo(x, y + h, x, y + h - r);
  this.lineTo(x, y + r);
  this.quadraticCurveTo(x, y, x + r, y);
  this.closePath();
  return this;
};
