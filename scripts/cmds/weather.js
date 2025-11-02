const axios = require("axios");
module.exports = {
  config: {
    name: "weather",
    aliases: ["temp", "forecast"],
    version: "1.1",
    author: "Farhan",
    countDown: 5,
    role: 0,
    shortDescription: "Check weather of any location",
    longDescription: "Fetch real-time weather and forecast for any location using Open-Meteo API.",
    category: "utility",
    guide: {
      en: "{pn} <city or country>"
    }
  },

  onStart: async function({ message, args }) {
    const location = args.join(" ");
    if (!location) return message.reply("🌍 Please provide a location. Example:\n/weather Dhaka");

    try {
      // Step 1: Get coordinates
      const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}`);
      if (!geo.data.results || geo.data.results.length === 0)
        return message.reply(`❌ Location "${location}" not found.`);

      const { latitude, longitude, name, country } = geo.data.results[0];

      // Step 2: Fetch weather data
      const weather = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );

      const current = weather.data.current_weather;
      const daily = weather.data.daily;

      const reply = `
🌦️ **Weather for ${name}, ${country}**
━━━━━━━━━━━━━━━
🌡️ Temperature: ${current.temperature}°C
💨 Wind: ${current.windspeed} km/h
🔼 Max Today: ${daily.temperature_2m_max[0]}°C
🔽 Min Today: ${daily.temperature_2m_min[0]}°C
☁️ Condition Code: ${current.weathercode}
🕓 Timezone: ${weather.data.timezone}
━━━━━━━━━━━━━━━
📅 Data from Open-Meteo API (Free & Open Source)
      `.trim();

      message.reply(reply);
    } catch (err) {
      console.error(err);
      message.reply("⚠️ Unable to fetch weather data. Please try again later.");
    }
  }
};
