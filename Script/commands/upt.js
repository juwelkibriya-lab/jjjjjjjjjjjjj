module.exports.config = {
name: "upt",
version: "3.2.0",
hasPermssion: 0,
credits: "MR JUWEL",
description: "Stylish text-based bot uptime notice",
commandCategory: "system",
usages: "upt",
cooldowns: 5
};

// ========== BOLD FONT CONVERTER ==========
const toBold = (str) => {
const normal =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const bold = Array.from(
"𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙" +
"𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳" +
"𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗"
);

return Array.from(str).map(ch => {
const index = normal.indexOf(ch);
return index !== -1 ? bold[index] : ch;
}).join("");
};

// ========== NO PREFIX HANDLER ==========
module.exports.handleEvent = async function ({ api, event }) {
if (!event.body) return;

if (event.body.trim().toLowerCase() === "upt") {
return module.exports.run({ api, event });
}
};

// ========== MAIN COMMAND ==========
module.exports.run = async function ({ api, event }) {
try {
// Bot uptime in days, hours, minutes and seconds
const totalSeconds = Math.floor(process.uptime());

const days = Math.floor(totalSeconds / 86400);
const hours = Math.floor((totalSeconds % 86400) / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const seconds = totalSeconds % 60;

const uptime =
  `${toBold(String(days))}d ` +
  `${toBold(String(hours))}h ` +
  `${toBold(String(minutes))}m ` +
  `${toBold(String(seconds))}s`;

// Bangladesh time (UTC+6)
const now = new Date(Date.now() + 6 * 60 * 60 * 1000);

const time =
  `${String(now.getUTCHours()).padStart(2, "0")}:` +
  `${String(now.getUTCMinutes()).padStart(2, "0")}:` +
  `${String(now.getUTCSeconds()).padStart(2, "0")}`;

const date =
  `${String(now.getUTCDate()).padStart(2, "0")}/` +
  `${String(now.getUTCMonth() + 1).padStart(2, "0")}/` +
  `${now.getUTCFullYear()}`;

// ========== UI 2: STYLISH BOX ==========
const notice =
  `╔═══「 ${toBold("SYSTEM NOTICE")} 」═══╗\n` +
  `┃\n` +
  `┃ ⚡ ${toBold("BOT")}       ➜ ${toBold("ONLINE")}\n` +
  `┃\n` +
  `┃ ⏳ ${toBold("UPTIME")}\n` +
  `┃ ➜ ${uptime}\n` +
  `┃\n` +
  `┃ 🕒 ${toBold("TIME")} ➜ ${toBold(time)}\n` +
  `┃ 🌏 ${toBold("ZONE")} ➜ ${toBold("BANGLADESH")}\n` +
  `┃ 📅 ${toBold("DATE")} ➜ ${toBold(date)}\n` +
  `┃\n` +
  `╠══════════════════════╣\n` +
  `┃\n` +
  `┃ 💚 ${toBold("MR JUWEL CHAT BOT")}\n` +
  `┃ ${toBold("BOT IS RUNNING 24/7")}\n` +
  `┃\n` +
  `╚══════════════════════╝`;

return api.sendMessage(
  notice,
  event.threadID,
  undefined,
  event.messageID
);

} catch (error) {
console.error("UPT Error:", error);

return api.sendMessage(
  `❌ ${toBold("UPT NOTICE ERROR")}`,
  event.threadID,
  undefined,
  event.messageID
);

}
};
