import axios from "axios";

const config = {
  name: "gcan",
  version: "2.0",
  author: "Farhan",
  role: 0,
  countDown: 5,
  shortDescription: "Guess a country",
  longDescription: "Give a hint or fragment and I will try to guess the country using a free API.",
  category: "game",   // changed to game category
  guide: {
    en: "{p}gcan <hint or name fragment>"
  }
};

async function onCall({ message, args }) {
  if (!args || args.length === 0) {
    return message.reply(
      "⚠️ You must provide something to guess the country.\nUsage: gcan <hint or name fragment>"
    );
  }

  const query = args.join(" ").trim();
  const waitMsg = await message.reply(`🔍 Guessing country for "${query}", please wait...`);

  try {
    // Use REST Countries API to attempt finding country by name fragment
    const apiUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fullText=false`;
    const res = await axios.get(apiUrl);
    const dataArr = res.data;

    if (!Array.isArray(dataArr) || dataArr.length === 0) {
      throw new Error("No matching country found");
    }

    // pick the first match
    const countryData = dataArr[0];
    const countryName = countryData.name.common || countryData.name.official;
    const region = countryData.region || "Unknown region";
    const capital = (countryData.capital && countryData.capital[0]) || "Unknown capital";
    const population = countryData.population || "Unknown population";

    let replyText = `🌍 Guess Country Result for: "${query}"\n`;
    replyText += `**Country:** ${countryName}\n`;
    replyText += `**Region:** ${region}\n`;
    replyText += `**Capital:** ${capital}\n`;
    replyText += `**Population:** ${population.toLocaleString()}\n`;

    await message.reply(replyText);
  } catch (err) {
    console.error("Error in gcan command:", err);
    await message.reply("❌ Failed to guess the country. Maybe invalid input or API error.");
  } finally {
    if (waitMsg?.messageID) {
      message.unsend(waitMsg.messageID);
    }
  }
}

export default {
  config,
  onCall
};
