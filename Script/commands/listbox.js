module.exports.config = {
  name: "listbox",
  version: "3.2.0",
  credits: "MRJUWEL",
  hasPermssion: 2,
  description: "Advanced thread manager (bulk + analytics + role control)",
  commandCategory: "System",
  usages: "listbox",
  cooldowns: 10
};

/* ===================== HANDLE EVENT (ADDED BY TRACKER) ===================== */

module.exports.handleEvent = async function ({ api, event, Threads }) {
  try {
    if (event.logMessageType !== "log:subscribe") return;

    const botID = String(api.getCurrentUserID());
    const added = event.logMessageData?.addedParticipants || [];
    if (!added.some(p => String(p.userFbId) === botID)) return;

    const data = (await Threads.getData(event.threadID)).data || {};
    data.addedBy = { id: event.author, time: Date.now() };
    await Threads.setData(event.threadID, { data });
  } catch (e) {
    console.log("LISTBOX handleEvent ERROR:", e);
  }
};

/* ===================== HANDLE REPLY ===================== */

module.exports.handleReply = async function ({ api, event, Threads, handleReply }) {
  try {
    if (!handleReply || parseInt(event.senderID) !== parseInt(handleReply.author)) return;

    const args = (event.body || "").trim().split(/\s+/);
    const cmd = (args[0] || "").toLowerCase();
    const index = parseInt(args[1]);
    const idgr = !isNaN(index) ? handleReply.groupid?.[index - 1] : undefined;

    // যে কমান্ডে নাম্বার লাগে না
    const noIndexCmds = ["help", "refresh", "inactive", "send"];

    if (!idgr && !noIndexCmds.includes(cmd)) {
      return api.sendMessage("⚠️ সঠিক নাম্বার দিন!", event.threadID);
    }

    /* ================= BAN ================= */
    if (cmd === "ban") {
      const data = (await Threads.getData(idgr)).data || {};
      data.banned = true;
      await Threads.setData(idgr, { data });

      global.data.threadBanned.set(idgr, 1);
      logAction("BAN", idgr, event.senderID);

      return api.sendMessage(`🚫 Group BANNED\nID: ${idgr}`, event.threadID);
    }

    /* ================= UNBAN ================= */
    if (cmd === "unban") {
      const data = (await Threads.getData(idgr)).data || {};
      data.banned = false;
      await Threads.setData(idgr, { data });

      global.data.threadBanned.delete(idgr);
      logAction("UNBAN", idgr, event.senderID);

      return api.sendMessage(`✅ Group UNBANNED\nID: ${idgr}`, event.threadID);
    }

    /* ================= OUT ================= */
    if (cmd === "out") {
      await api.removeUserFromGroup(api.getCurrentUserID(), idgr);
      logAction("OUT", idgr, event.senderID);

      return api.sendMessage(`👋 Left group:\nID: ${idgr}`, event.threadID);
    }

    /* ================= INFO (WITH ADDED BY) ================= */
    if (cmd === "info") {
      const info = await api.getThreadInfo(idgr);
      const admins = (info.adminIDs || []).map(a => a.id).join(", ") || "None";

      // কে বটকে অ্যাড করেছিল
      const tdata = (await Threads.getData(idgr)).data || {};
      let adder = "Unknown (আগে থেকেই ছিল)";

      if (tdata.addedBy?.id) {
        const uid = tdata.addedBy.id;
        let name = "Unknown";
        try {
          const u = await api.getUserInfo(uid);
          name = u[uid]?.name || name;
        } catch (e) {
          console.log("getUserInfo error:", uid, e.message || e);
        }
        adder = `${name}\n🆔 ${uid}\n🔗 https://facebook.com/${uid}`;
      }

      return api.sendMessage(
`📊 GROUP INFO

📛 Name: ${info.threadName || "Unknown"}
🆔 ID: ${idgr}
👥 Members: ${info.participantIDs?.length || 0}
👑 Admins: ${admins}
🔒 Approval: ${info.approvalMode ? "ON" : "OFF"}
😀 Emoji: ${info.emoji || "None"}
➕ Added by: ${adder}`,
        event.threadID
      );
    }

    /* ================= REFRESH ================= */
    if (cmd === "refresh") {
      return module.exports.run({ api, event });
    }

    /* ================= INACTIVE ================= */
    if (cmd === "inactive") {
      let msg = "📉 INACTIVE GROUPS\n\n";
      let found = 0;

      for (let i = 0; i < handleReply.groupid.length; i++) {
        const id = handleReply.groupid[i];
        let count = handleReply.messageCounts?.[i];

        // লিস্টে না পেলে getThreadInfo থেকে চেষ্টা
        if (typeof count !== "number") {
          try {
            const info = await api.getThreadInfo(id);
            count = info.messageCount;
          } catch (e) {
            console.log("inactive getThreadInfo error:", id, e.message || e);
          }
        }

        if (typeof count === "number" && count < 50) {
          msg += `• ${handleReply.groupnames?.[i] || "Unknown"} (#${i + 1})\nID: ${id}\nMessages: ${count}\n\n`;
          found++;
        }
      }

      return api.sendMessage(found ? msg : "No inactive groups found", event.threadID);
    }

    /* ================= BROADCAST ================= */
    // ব্যবহার: send <মেসেজ>        -> সব গ্রুপে
    //          send <no> <মেসেজ>   -> শুধু ওই নাম্বারের গ্রুপে
    if (cmd === "send") {
      let targets = handleReply.groupid;
      let message;

      if (idgr && args.length > 2) {
        targets = [idgr];
        message = args.slice(2).join(" ");
      } else {
        message = args.slice(1).join(" ");
      }

      if (!message) return api.sendMessage("⚠️ Message দিন!", event.threadID);

      let success = 0;

      for (let id of targets) {
        try {
          await api.sendMessage(message, id);
          success++;
        } catch (e) {
          console.log("send error:", id, e.message || e);
        }
        await new Promise(r => setTimeout(r, 500)); // rate limit এড়াতে
      }

      logAction("SEND", `${success} groups`, event.senderID);
      return api.sendMessage(`📤 Sent to ${success} groups`, event.threadID);
    }

  } catch (e) {
    console.log("LISTBOX handleReply ERROR:", e);
    return api.sendMessage("❌ Error occurred in action!", event.threadID);
  }
};

/* ===================== MAIN RUN ===================== */

module.exports.run = async function ({ api, event }) {
  try {
    const inbox = await api.getThreadList(100, null, ["INBOX"]);
    const list = (inbox || []).filter(g => g.isGroup);

    let groups = list.map(g => ({
      id: g.threadID,
      name: g.name || g.threadName || "Unknown",
      members: g.participants?.length || g.participantIDs?.length || 0,
      messageCount: typeof g.messageCount === "number" ? g.messageCount : undefined
    }));

    // সদস্য সংখ্যা না পেলে getThreadInfo দিয়ে চেষ্টা
    for (const g of groups) {
      if (g.members === 0) {
        try {
          const info = await api.getThreadInfo(g.id);
          g.members = info?.participantIDs?.length || 0;
          if (info?.threadName) g.name = info.threadName;
          if (typeof info?.messageCount === "number") g.messageCount = info.messageCount;
        } catch (e) {
          console.log("getThreadInfo error:", g.id, e.message || e);
        }
      }
    }

    groups.sort((a, b) => b.members - a.members);

    if (groups.length === 0) {
      return api.sendMessage("⚠️ কোনো গ্রুপ পাওয়া যায়নি!", event.threadID);
    }

    const pageSize = 20;
    const page = 1;
    const start = (page - 1) * pageSize;
    const pageData = groups.slice(start, start + pageSize);

    let groupid = [];
    let groupnames = [];
    let messageCounts = [];

    /* ================= UI ================= */
    let msg = `╔═══════ LISTBOX PRO ═══════╗\n`;
    msg += `📄 Page: ${page}\n╚══════════════════════════╝\n\n`;

    pageData.forEach((g, i) => {
      msg += `╔═══ ${start + i + 1} ═══╗\n`;
      msg += `📛 ${g.name}\n`;
      msg += `🆔 ${g.id}\n`;
      msg += `👥 ${g.members} Members\n`;
      msg += `╚════════════╝\n\n`;
      groupid.push(g.id);
      groupnames.push(g.name);
      messageCounts.push(g.messageCount);
    });

    msg += `━━━━━━━━━━━━━━
Reply:
ban <no>
unban <no>
out <no>
info <no>
inactive
send msg  (সব গ্রুপে)
send <no> msg  (একটি গ্রুপে)
refresh`;

    api.sendMessage(msg, event.threadID, (err, data) => {
      if (err) return console.log("LISTBOX send error:", err);

      global.client.handleReply.push({
        name: module.exports.config.name,
        author: event.senderID,
        messageID: data.messageID,
        groupid,
        groupnames,
        messageCounts,
        type: "reply",
        page
      });
    });

  } catch (e) {
    console.log("LISTBOX ERROR:", e);
    api.sendMessage("❌ Failed to load group list", event.threadID);
  }
};

/* ===================== LOG SYSTEM ===================== */

function logAction(type, id, user) {
  console.log(`📌 ACTION: ${type} | GROUP: ${id} | BY: ${user}`);
                     }
