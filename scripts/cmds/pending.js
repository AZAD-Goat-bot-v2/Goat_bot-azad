module.exports = { 
  config: { 
    name: "p", 
    version: "1.0", 
    author: "BaYjid 👽", 
    countDown: 5, 
    role: 2, 
    shortDescription: { vi: "", en: "" }, 
    longDescription: { vi: "", en: "" }, 
    category: "pending" 
  },

  langs: { 
    en: { 
      invalidNumber: "❎ 『%1』 is not a valid number!", 
      cancelSuccess: "❎ Refused 『%1』 thread(s)!", 
      approveSuccess: "✅ Approved 『%1』 thread(s) successfully!", 
      cantGetPendingList: "⚠️ Can't get the pending list!", 
      returnListPending: "😎『PENDING』😋\n\n❮ Total threads to approve: 『%1』❯\n\n%2", 
      returnListClean: "🥱『PENDING』↩😗\nNo pending threads found!"
    } 
  },

  onReply: async function ({ api, event, Reply, getLang }) { 
    if (String(event.senderID) !== String(Reply.author)) return; 
    const { body, threadID, messageID } = event; 
    let count = 0;

    const isCancel = body.toLowerCase().startsWith("c") || body.toLowerCase().startsWith("cancel");
    const indices = body.replace(/^[cC]ancel?\s*/, "").split(/\s+/);

    for (const index of indices) {
      const num = parseInt(index);
      if (isNaN(num) || num <= 0 || num > Reply.pending.length) {
        return api.sendMessage(getLang("invalidNumber", num), threadID, messageID);
      }

      if (isCancel) {
        api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[num - 1].threadID);
      } else {
        const prefix = global.utils.getPrefix(Reply.pending[num - 1].threadID); // Prefix Get

        api.sendMessage(
          `╔════════════════╗\n` +
          `║💻 Azad er gf Officiʌl ɱʌfiʌ Giʀl bot 💻\n` +
          `╚════════════════╝\n\n` +
          `🗿 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂 𝗳𝗼𝗿 𝗶𝗻𝘃𝗶𝘁𝗶𝗻𝗴 𝗺𝗲! 🌟\n\n` +
          `💱 𝗟𝗲𝘁'𝘀 𝗴𝗲𝘁 𝘀𝘁𝗮𝗿𝘁𝗲𝗱!\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `⚔️ 𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅: 『 ${prefix} 』\n` +
          `📌 𝗖𝗵𝗲𝗰𝗸 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: 『 ${prefix}help 』\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `⚒️ 𝗡𝗲𝗲𝗱 𝗛𝗲𝗹𝗽? 𝗝𝘂𝘀𝘁 𝗔𝘀𝗸! 🚀`,
          Reply.pending[num - 1].threadID
        );
      }
      count++;
    }

    return api.sendMessage(getLang(isCancel ? "cancelSuccess" : "approveSuccess", count), threadID, messageID);
  },

  onStart: async function ({ api, event, getLang, commandName }) { 
    const { threadID, messageID } = event; 
    let msg = "", index = 1;

    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

      for (const BaYjid of list) {
        msg += `🔹『${index++}』 ${BaYjid.name} 『${BaYjid.threadID}』\n`;
      }

      if (list.length !== 0) {
        return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        }, messageID);
      } else {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  }
};
