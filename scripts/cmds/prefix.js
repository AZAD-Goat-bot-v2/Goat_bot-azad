const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "2.1",
		author: "Az ad",
		countDown: 5,
		role: 0,
		description: "Change bot prefix in your group or globally with premium interactive style",
		category: "config",
		guide: {
			en: "{pn} <new prefix>: change prefix in this group\n" +
				"{pn} <new prefix> -g: change global prefix (admin only)\n" +
				"{pn} reset: reset prefix to default\n" +
				"{pn}: show current prefixes in stylish info box"
		}
	},

	langs: {
		en: {
			reset: "✅ Prefix reset to default:\n➡️  System prefix: %1",
			onlyAdmin: "⛔ Only admin can change the system-wide prefix.",
			confirmGlobal: "⚙️ Global prefix change requested.\nReact ✅ to confirm.\n📷 Check image below.",
			confirmThisThread: "🛠️ Group prefix change requested.\nReact ✅ to confirm.\n📷 Check image below.",
			successGlobal: "🎉 Global prefix changed successfully!\n🆕 New prefix: %1 🎉",
			successThisThread: "🎊 Group prefix updated!\n🆕 New prefix: %1 🎊"
		}
	},

	onStart: async function({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0]) return message.SyntaxError();

		const prefixImage = "https://i.ibb.co/Zzqz5nBx/file-00000000588061f6ac814c432f6c0273.png";

		// RESET PREFIX
		if (args[0].toLowerCase() === "reset") {
			await threadsData.set(event.threadID, null, "data.prefix");
			global.GoatBot.config.prefix = global.GoatBot.config.prefix || "!";
			return message.reply({
				body: getLang("reset", global.GoatBot.config.prefix),
				attachment: await utils.getStreamFromURL(prefixImage)
			});
		}

		const newPrefix = args[0];
		const setGlobal = args[1] === "-g";

		if (setGlobal && role < 2)
			return message.reply(getLang("onlyAdmin"));

		const confirmMsg = setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");

		return message.reply({
			body: `✨ ${confirmMsg} ✨`,
			attachment: await utils.getStreamFromURL(prefixImage)
		}, (err, info) => {
			global.GoatBot.onReaction.set(info.messageID, {
				commandName,
				author: event.senderID,
				newPrefix,
				setGlobal,
				messageID: info.messageID,
				animationStep: 0
			});
		});
	},

	onReaction: async function({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal, messageID, animationStep } = Reaction;
		if (event.userID !== author) return;

		// Animated confirmation effect
		const emojis = ["✨", "🎉", "💎", "✅"];
		if (animationStep < emojis.length) {
			message.setMessage(`Confirming ${emojis[animationStep]} ...`);
			Reaction.animationStep++;
			global.GoatBot.onReaction.set(messageID, Reaction);
			return;
		}

		// Apply prefix
		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			message.reply(getLang("successThisThread", newPrefix));
		}

		// Cleanup
		global.GoatBot.onReaction.delete(messageID);
	},

	onChat: async function({ event, message }) {
		if (!event.body) return;

		const body = event.body.trim();
		const command = body.split(" ")[0].toLowerCase();
		if (command !== "prefix") return;

		const systemPrefix = global.GoatBot.config.prefix;
		const groupPrefix = utils.getPrefix(event.threadID) || systemPrefix;

		const dateTime = new Date().toLocaleString("en-US", {
			timeZone: "Asia/Dhaka",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
			day: "2-digit",
			month: "2-digit",
			year: "numeric"
		});

		const [datePart, timePart] = dateTime.split(", ");

		// Premium stylish info box
		const infoBox = `
╔═════════ 🌸 ᴀᴢᴀᴅ ᴄʜᴀᴛ ʙᴏᴛ 🤖 ═════════╗
🌐 System Prefix  : ⚡ ${systemPrefix.padEnd(8)}
💬 Group Prefix   : 💎 ${groupPrefix.padEnd(8)}
🕒 Time           : ⏰ ${timePart.padEnd(8)}
📅 Date           : 📆 ${datePart.padEnd(8)}
╚═════════════════════════════════════╝
✨ Type "prefix <new>" to change, or "prefix reset" to reset! ✨`;

		const prefixImage = "https://i.imgur.com/7DVKZWL.jpeg";

		return message.reply({
			body: infoBox,
			attachment: await utils.getStreamFromURL(prefixImage)
		});
	}
};
