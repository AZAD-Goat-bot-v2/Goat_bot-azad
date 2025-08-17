const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "3.0",
    author: "Azad",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName;
    const memberCount = threadInfo.participantIDs.length;

    const FONT_NAME = "ModernNoirBold";
    const FONT_URL = "https://github.com/Saim12678/Saim/blob/693ceed2f392ac4fe6f98f77b22344f6fc5ac9f8/fonts/tt-modernoir-trial.bold.ttf?raw=true";

    const tmp = path.join(__dirname, "..", "cache");
    await fs.ensureDir(tmp);
    const fontPath = path.join(tmp, `${FONT_NAME}.ttf`);
    if (!fs.existsSync(fontPath)) {
      const fontRes = await axios.get(FONT_URL, { responseType: "arraybuffer" });
      fs.writeFileSync(fontPath, fontRes.data);
    }
    registerFont(fontPath, { family: FONT_NAME });

    // Backgrounds
    const backgrounds = [
      "https://files.catbox.moe/cj68oa.jpg",
      "https://files.catbox.moe/0n8mmb.jpg",
      "https://files.catbox.moe/hvynlb.jpg",
      "https://files.catbox.moe/leyeuq.jpg",
      "https://files.catbox.moe/7ufcfb.jpg",
      "https://files.catbox.moe/y78bmv.jpg"
    ];
    const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // Prepare paths
    const bgPath = path.join(tmp, "bg.jpg");
    const outputPath = path.join(tmp, `welcome.png`);

    try {
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(bgPath, bgRes.data);
      const bg = await loadImage(bgPath);

      const W = 1000, H = 600;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 0, W, H);

      // Title
      ctx.fillStyle = "#fff";
      ctx.font = `70px ${FONT_NAME}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 15;
      ctx.fillText("🎉 Welcome 🎉", W / 2, 100);

      // User Avatars
      const avatarSize = 160;
      const gap = 40;
      const startX = (W - (newUsers.length * (avatarSize + gap) - gap)) / 2;
      const y = 150;

      let names = [];

      for (let i = 0; i < newUsers.length; i++) {
        const user = newUsers[i];
        const userId = user.userFbId;
        const fullName = user.fullName;
        names.push(fullName);

        const avatarPath = path.join(tmp, `avt_${userId}.png`);

        try {
          const avatarRes = await axios.get(
            `https://graph.facebook.com/${userId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
            { responseType: "arraybuffer" }
          );
          fs.writeFileSync(avatarPath, avatarRes.data);
          const avatar = await loadImage(avatarPath);

          const x = startX + i * (avatarSize + gap);

          ctx.beginPath();
          ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
          ctx.restore();

          fs.unlinkSync(avatarPath);
        } catch {
          // fallback default avatar
        }
      }

      // Draw Names
      ctx.font = `45px ${FONT_NAME}`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.fillText(names.join(" | "), W / 2, 370);

      // Group Info
      ctx.font = `38px ${FONT_NAME}`;
      ctx.fillText(`Group: ${groupName}`, W / 2, 430);
      ctx.font = `32px ${FONT_NAME}`;
      ctx.fillText(`Now total members: ${memberCount}`, W / 2, 480);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outputPath, buffer);

      // Time in Bangla
      const timeStr = new Date().toLocaleString("bn-BD", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
        hour12: true,
      });

      await api.sendMessage({
        body:
          `🎊 স্বাগতম ${names.join(", ")}!\n` +
          `👉 গ্রুপ: ${groupName}\n` +
          `👥 এখন মোট সদস্য: ${memberCount}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `⏰ ${timeStr}\n` +
          `আশা করি সবাই এখানে মজা পাবে 😍🔥`,
        attachment: fs.createReadStream(outputPath),
        mentions: newUsers.map(u => ({ tag: u.fullName, id: u.userFbId }))
      }, threadID);

      fs.unlinkSync(bgPath);
      fs.unlinkSync(outputPath);

    } catch (err) {
      console.error("❌ Error generating welcome image:", err);
    }
  }
};
