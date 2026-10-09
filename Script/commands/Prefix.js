const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "prefix",
  version: "2.0.7",
  hasPermssion: 0,
  credits: "MR JUWEL",
  description: "Display bot prefix, owner info & stats",
  commandCategory: "Information",
  usages: "",
  cooldowns: 5
};

// 🚫 Anti-spam store
const spamMap = new Map();
const SPAM_COOLDOWN = 10000; // 10 seconds

// 🔧 Get prefix from config.json
function getConfigPrefix() {
  try {
    const configPath = path.join(__dirname, "..", "..", "config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (configData.PREFIX && configData.PREFIX.trim() !== "") {
        return configData.PREFIX;
      }
    }
  } catch (e) {
    console.log("⚠️ config.json read error:", e.message);
  }
  return null;
}

module.exports.handleEvent = async ({ event, api, Threads }) => {
  const { threadID, messageID, body, senderID } = event;
  if (!body) return;

  // 🚫 Anti-spam check
  const now = Date.now();
  if (spamMap.has(senderID)) {
    if (now - spamMap.get(senderID) < SPAM_COOLDOWN) return;
  }

  // ⚙️ Prefix info — config.json চেক → thread data → global config
  const configPrefix = getConfigPrefix();
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = configPrefix || threadSetting.PREFIX || global.config.PREFIX;

  // 🌐 Multi-language trigger words
  const triggerWords = [
    "prefix", "mprefix", "mpre", "bot prefix", "what is the prefix", "bot name",
    "how to use bot", "bot not working", "bot is offline", "prefx", "prfix",
    "perfix", "bot not talking", "where is bot", "bot dead", "bots dead",
    "what prefix", "freefix", "what is bot", "what prefix bot",
    "how use bot", "where are the bots", "where prefix",
    "প্রিফিক্স", "বট প্রিফিক্স", "পিন", "বটের নাম", "বট কি",
    "বট কাজ করছে না", "বট অফলাইন", "প্রিফিক্স কি",
    "प्रीफिक्स", "बॉट प्रीफिक्स", "बॉट का नाम", "बॉट क्या है",
    "dấu lệnh", "daulenh", "tiền tố"
  ];

  const lowerBody = body.toLowerCase().trim();
  if (!triggerWords.includes(lowerBody)) return;

  spamMap.set(senderID, now);

  // 💖 Random reaction
  const reactions = ["💖", "✨", "🌸", "💫", "❤️", "🦋", "🌟"];
  api.setMessageReaction(
    reactions[Math.floor(Math.random() * reactions.length)],
    messageID, () => {}, true
  );

  // ⚠️ Prefix blank check
  if (!prefix || String(prefix).trim() === "") {
    return api.sendMessage("⚠️ Prefix have not to be blank", threadID, messageID);
  }

  // 📊 Uptime & Stats
  const uptimeSec = process.uptime();
  const days  = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins  = Math.floor((uptimeSec % 3600) / 60);
  const uptimeStr = `${days}d ${hours}h ${mins}m`;

  const totalUsers   = global.data.allUserID?.length   || 0;
  const totalThreads = global.data.allThreadID?.length || 0;

  // 🎯 Pull from config
  const botName   = global.config.BOTNAME     || "⎯꯭𓆩꯭𝆺𝅥😻⃞𝐑⃞𝐈⃞𝐘⃞𝐀⃞༢࿐";
  const ownerName = global.config.OWNER_NAME  || "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

  return api.sendMessage(
`╭─────────────⭓
│  ✨ 𝐏𝐑𝐄𝐅𝐈𝐗 ✨
│  ➤ 『 ${prefix} 』
├─────────────⭓
│  🤖 ${botName}
│  👑 ${ownerName}
│  ⏱️ ${uptimeStr}
│  👥 ${totalUsers}  |  💬 ${totalThreads}
╰─────────────⭓`,
    threadID,
    null
  );
};

// ✅ Required function
module.exports.run = async ({ event, api, Threads }) => {
  const { threadID, messageID } = event;

  // ⚙️ config.json চেক
  const configPrefix = getConfigPrefix();
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = configPrefix || threadSetting.PREFIX || global.config.PREFIX;

  // ⚠️ Prefix blank check
  if (!prefix || String(prefix).trim() === "") {
    return api.sendMessage("⚠️ Prefix have not to be blank", threadID, messageID);
  }

  const uptimeSec = process.uptime();
  const days  = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins  = Math.floor((uptimeSec % 3600) / 60);
  const uptimeStr = `${days}d ${hours}h ${mins}m`;

  const totalUsers   = global.data.allUserID?.length   || 0;
  const totalThreads = global.data.allThreadID?.length || 0;

  const botName   = global.config.BOTNAME     || "⎯꯭𓆩꯭𝆺𝅥😻⃞𝐑⃞𝐈⃞𝐘⃞𝐀⃞༢࿐";
  const ownerName = global.config.OWNER_NAME  || "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

  return api.sendMessage(
`╭─────────────⭓
│  ✨ 𝐏𝐑𝐄𝐅𝐈𝐗 ✨
│  ➤ 『 ${prefix} 』
├─────────────⭓
│  🤖 ${botName}
│  👑 ${ownerName}
│  ⏱️ ${uptimeStr}
│  👥 ${totalUsers}  |  💬 ${totalThreads}
╰─────────────⭓`,
    threadID,
    null
  );
};
