module.exports.config = {
  name: "imgurall",
  version: "2.4.0",
  hasPermssion: 3,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Upload last N group media to Imgur (admin only). Usage: imgurall 10",
  commandCategory: "other",
  usages: "imgurall [count]",
  cooldowns: 30,
};

// ===== বট এডমিন লিস্ট বের করার হেল্পার =====
function getBotAdmins() {
  const fs = global.nodemodule['fs-extra'];
  const path = global.nodemodule['path'];

  const possiblePaths = [];

  if (global.client && global.client.dirConfig) {
    possiblePaths.push(global.client.dirConfig);
  }

  try {
    possiblePaths.push(path.join(__dirname, "..", "..", "config.json"));
    possiblePaths.push(path.join(__dirname, "..", "..", "..", "config.json"));
    possiblePaths.push(path.join(process.cwd(), "config.json"));
  } catch (e) {}

  if (global.config && typeof global.config === "object") {
    const direct =
      global.config.ADMINBOT ||
      global.config.adminBot ||
      global.config.ADMIN ||
      global.config.admin;
    if (Array.isArray(direct) && direct.length > 0) {
      return direct.map(String);
    }
  }

  for (const p of possiblePaths) {
    try {
      if (p && fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
        const list =
          raw.ADMINBOT ||
          raw.adminBot ||
          raw.ADMIN ||
          raw.admin ||
          raw.adminIds ||
          [];
        if (Array.isArray(list) && list.length > 0) {
          return list.map(String);
        }
      }
    } catch (e) {}
  }

  return [];
}

module.exports.run = async ({ api, event, args }) => {
  const axios = global.nodemodule['axios'];
  const { threadID, messageID, senderID } = event;

  // ===== বট এডমিন চেক =====
  const botAdminList = getBotAdmins();
  const isBotAdmin =
    botAdminList.length > 0 && botAdminList.includes(String(senderID));

  if (!isBotAdmin) {
    return api.sendMessage(
      "⛔ এই কমান্ডটি শুধুমাত্র বট এডমিন চালাতে পারবে!",
      threadID,
      messageID
    );
  }

  // ===== নাম্বার পার্স করা (args[0]) =====
  const MAX_LIMIT = 30;
  let requestedCount = MAX_LIMIT;

  if (args && args.length > 0) {
    const parsed = parseInt(args[0], 10);
    if (!isNaN(parsed) && parsed > 0) {
      requestedCount = parsed;
    }
  }

  // সর্বোচ্চ লিমিট ৩০
  if (requestedCount > MAX_LIMIT) requestedCount = MAX_LIMIT;

  // ===== API key fetch =====
  let Shaon;
  try {
    const apis = await axios.get(
      'https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json'
    );
    Shaon = apis.data.imgur;
  } catch (e) {
    return api.sendMessage("❌ API লোড করা যায়নি!", threadID, messageID);
  }

  // ===== ১০ সেকেন্ড ওয়েট =====
  api.sendMessage(
    `⏳ ${requestedCount} টি মিডিয়া খুঁজছি... ১০ সেকেন্ড অপেক্ষা করুন...`,
    threadID,
    messageID
  );

  await new Promise((resolve) => setTimeout(resolve, 10000));

  // ===== গ্রুপের মেসেজ হিস্ট্রি থেকে মিডিয়া সংগ্রহ =====
  // কমান্ড মেসেজ থেকে উপরের দিকে গুনে requestedCount টি মিডিয়া নিবে
  let mediaList = [];

  try {
    const threadInfo = await api.getThreadHistory(
      threadID,
      requestedCount * 5 + 20,
      Date.now()
    );

    if (threadInfo && threadInfo.length > 0) {
      // timestamp অনুযায়ী descending (নতুন আগে)
      const sorted = [...threadInfo].sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );

      // কমান্ড মেসেজ (বর্তমান messageID) খুঁজে বের করা
      const commandIndex = sorted.findIndex(
        (m) => m.messageID === messageID
      );

      // কমান্ড মেসেজের পরে (নিচে) যেসব আছে সেগুলো বাদ
      // এবং কমান্ড মেসেজ থেকে উপরের (পুরোনো) দিকের মেসেজ নিব
      let scanList;
      if (commandIndex !== -1) {
        // কমান্ড মেসেজের পরে (index > commandIndex) মেসেজ = নতুন মেসেজ, বাদ দিতে হবে
        scanList = sorted.slice(commandIndex + 1);
      } else {
        scanList = sorted;
      }

      for (const msg of scanList) {
        if (mediaList.length >= requestedCount) break;

        if (msg.attachments && msg.attachments.length > 0) {
          for (const att of msg.attachments) {
            if (mediaList.length >= requestedCount) break;

            const type = att.type;
            if (
              type === "photo" ||
              type === "video" ||
              type === "animated_image" ||
              (att.url &&
                /\.(jpg|jpeg|png|gif|mp4|webm|mov)$/i.test(att.url))
            ) {
              mediaList.push({
                url: att.url,
                type: type,
                timestamp: msg.timestamp,
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("History fetch error:", e);
  }

  // ===== ডুপ্লিকেট বাদ =====
  const uniqueMedia = [];
  const seen = new Set();
  for (const m of mediaList) {
    if (!seen.has(m.url)) {
      seen.add(m.url);
      uniqueMedia.push(m);
    }
  }

  const finalMedia = uniqueMedia.slice(0, requestedCount);

  if (finalMedia.length === 0) {
    return api.sendMessage(
      "❌ গ্রুপে কোনো মিডিয়া পাওয়া যায়নি!",
      threadID,
      messageID
    );
  }

  // ===== Imgur-এ আপলোড =====
  const uploadedLinks = [];
  for (let i = 0; i < finalMedia.length; i++) {
    try {
      const mediaUrl = encodeURIComponent(finalMedia[i].url);
      const res = await axios.get(`${Shaon}/imgur?link=${mediaUrl}`);
      const link = res.data?.uploaded?.image;
      if (link && link.startsWith("http")) {
        uploadedLinks.push(`"${link}"`);
      }
    } catch (e) {
      // ফেইল হলে স্কিপ
    }
  }

  if (uploadedLinks.length === 0) {
    return api.sendMessage(
      "❌ কোনো মিডিয়া আপলোড করা যায়নি!",
      threadID,
      messageID
    );
  }

  // ===== সরাসরি লিংক পাঠানো =====
  const formattedLinks = uploadedLinks.join(",\n");

  return api.sendMessage(formattedLinks, threadID, messageID);
};
