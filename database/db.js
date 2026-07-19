const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'giftblox.db');
const OWNER_ID = '1527668994210005002';

let db;

function save() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function uid() {
  return Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
}

async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    // Fix WAL compatibility
    try { db.run("PRAGMA journal_mode=MEMORY"); } catch(e) {}
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT DEFAULT 'Inconnu',
      discriminator TEXT DEFAULT '0',
      avatar TEXT,
      email TEXT,
      points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      daily_streak INTEGER DEFAULT 0,
      last_daily TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      invite_count INTEGER DEFAULT 0,
      referred_by TEXT,
      is_banned INTEGER DEFAULT 0,
      role TEXT DEFAULT 'member'
    );
  `);
  db.run(`CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY, code TEXT UNIQUE, referrer_id TEXT NOT NULL, referred_id TEXT,
    used_count INTEGER DEFAULT 0, rewards_given INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (referrer_id) REFERENCES users(id), FOREIGN KEY (referred_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL,
    description TEXT, created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, item_id TEXT, item_name TEXT NOT NULL,
    item_type TEXT NOT NULL, price INTEGER NOT NULL, status TEXT DEFAULT 'completed',
    metadata TEXT, created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL,
    status TEXT DEFAULT 'open', priority TEXT DEFAULT 'medium', category TEXT DEFAULT 'general',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    resolved_at TEXT, admin_notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, user_id TEXT NOT NULL,
    content TEXT NOT NULL, is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id), FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
    icon TEXT DEFAULT 'trophy', color TEXT DEFAULT 'purple'
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS user_badges (
    user_id TEXT NOT NULL, badge_id TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (badge_id) REFERENCES badges(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
    type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, type TEXT NOT NULL,
    goal INTEGER NOT NULL, reward INTEGER NOT NULL, reward_type TEXT DEFAULT 'points',
    icon TEXT DEFAULT 'target', active INTEGER DEFAULT 1, starts_at TEXT, ends_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS user_quests (
    user_id TEXT NOT NULL, quest_id TEXT NOT NULL, progress INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0, claimed INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now','localtime')), completed_at TEXT,
    PRIMARY KEY (user_id, quest_id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price INTEGER NOT NULL,
    type TEXT NOT NULL, stock INTEGER DEFAULT -1, image_url TEXT, metadata TEXT,
    active INTEGER DEFAULT 1, category TEXT DEFAULT 'general',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS weekly_activity (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, week_start TEXT NOT NULL,
    points INTEGER DEFAULT 0, xp INTEGER DEFAULT 0, tasks_done INTEGER DEFAULT 0,
    UNIQUE(user_id, week_start),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Seed badges
  let count = db.exec("SELECT COUNT(*) as c FROM badges");
  if (!count.length || !count[0].values[0][0]) {
    const badges = [
      ['Premiers Pas', 'Complète ta première tâche', 'trophy', 'bronze'],
      ['Collectionneur', 'Accumule 500 points', 'gem', 'green'],
      ['Légende', 'Atteins le niveau 10', 'crown', 'gold'],
      ['Sociable', 'Parraine 5 personnes', 'users', 'blue'],
      ['Assidu', 'Streak de 7 jours', 'flame', 'orange'],
      ['Dévoué', 'Complète 50 quêtes', 'star', 'purple'],
      ['Millionnaire', 'Atteins 1M de points', 'diamond', 'red'],
      ['Vétéran', 'Atteins le niveau 50', 'shield', 'dark'],
    ];
    const stmt = db.prepare("INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)");
    for (const b of badges) stmt.run([uid(), b[0], b[1], b[2], b[3]]);
  }

  // Seed shop items
  let shopCount = db.exec("SELECT COUNT(*) as c FROM shop_items");
  if (!shopCount.length || !shopCount[0].values[0][0]) {
    const items = [
      ['Rôle VIP', 'Rôle exclusif sur le serveur', 5000, 'role', -1],
      ['100 Robux', 'Crédit Roblox', 150, 'code', 50],
      ['Rôle Premium', 'Rôle premium avec perks', 15000, 'role', -1],
      ['Carte Steam 5€', 'Code Steam', 3000, 'code', 10],
      ['Badge Exclusif', 'Badge unique sur ton profil', 2000, 'digital', -1],
      ['Nitro Boost 1 mois', 'Discord Nitro', 25000, 'code', 5],
    ];
    const stmt = db.prepare("INSERT INTO shop_items (id, name, description, price, type, stock) VALUES (?, ?, ?, ?, ?, ?)");
    for (const i of items) stmt.run([uid(), i[0], i[1], i[2], i[3], i[4]]);
  }

  // Seed quests
  let questCount = db.exec("SELECT COUNT(*) as c FROM quests");
  if (!questCount.length || !questCount[0].values[0][0]) {
    const quests = [
      ['Premier Pas', 'Gagne 100 points', 'daily', 100, 50, 'points', 'target'],
      ['Collecteur', 'Gagne 500 points', 'weekly', 500, 200, 'points', 'gem'],
      ['Social', 'Parraine 1 ami', 'weekly', 1, 300, 'points', 'users'],
      ['Dévoué', 'Streak de 3 jours', 'daily', 3, 100, 'points', 'flame'],
      ['Dépensier', 'Dépense 1000 points', 'weekly', 1000, 250, 'points', 'cart'],
    ];
    const stmt = db.prepare("INSERT INTO quests (id, title, description, type, goal, reward, reward_type, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const q of quests) stmt.run([uid(), q[0], q[1], q[2], q[3], q[4], q[5], q[6]]);
  }

  save();
}

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
      const rows = stmt.getAsObject(params);
      stmt.free();
      return rows;
    }
    stmt.run(params);
    stmt.free();
    save();
    return null;
  } catch (e) {
    console.error('DB error:', sql, params, e.message);
    return null;
  }
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = stmt.getAsObject(params);
  // getAsObject returns one row; need to iterate
  let results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results.length ? results : (rows && rows.id ? [rows] : []);
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

function getOrCreateUser(id, username) {
  let user = get("SELECT * FROM users WHERE id = ?", [id]);
  if (!user) {
    run("INSERT INTO users (id, username, role) VALUES (?, ?, ?)", [id, username || 'Inconnu', id === OWNER_ID ? 'admin' : 'member']);
    user = get("SELECT * FROM users WHERE id = ?", [id]);
  } else if (username && user.username === 'Inconnu') {
    run("UPDATE users SET username = ?, updated_at = datetime('now','localtime') WHERE id = ?", [username, id]);
    user.username = username;
  }
  return user;
}

function addPoints(userId, amount, desc) {
  run("UPDATE users SET points = points + ?, updated_at = datetime('now','localtime') WHERE id = ?", [amount, userId]);
  run("INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)", [uid(), userId, amount > 0 ? 'earn' : 'spend', amount, desc || `${Math.abs(amount)} points`]);
  return get("SELECT * FROM users WHERE id = ?", [userId]);
}

function setPoints(userId, amount) {
  run("UPDATE users SET points = ?, updated_at = datetime('now','localtime') WHERE id = ?", [amount, userId]);
  return get("SELECT * FROM users WHERE id = ?", [userId]);
}

function addXP(userId, amount) {
  let user = get("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  let newXP = user.xp + amount;
  let newLevel = user.level;
  while (newXP >= newLevel * 120) {
    newXP -= newLevel * 120;
    newLevel++;
  }
  run("UPDATE users SET xp = ?, level = ?, updated_at = datetime('now','localtime') WHERE id = ?", [newXP, newLevel, userId]);
  return get("SELECT * FROM users WHERE id = ?", [userId]);
}

function getLeaderboard(limit = 10) {
  return all("SELECT id, username, points, level FROM users ORDER BY points DESC LIMIT ?", [limit]);
}

function getGlobalStats() {
  let totalUsers = get("SELECT COUNT(*) as c FROM users").c;
  let totalPoints = get("SELECT COALESCE(SUM(points),0) as s FROM users").s;
  let totalTx = get("SELECT COUNT(*) as c FROM transactions").c;
  let ticketsOpen = get("SELECT COUNT(*) as c FROM tickets WHERE status IN ('open','in_progress')").c;
  return { totalUsers, activeToday: 0, totalPoints, totalTransactions: totalTx, ticketsOpen, serverAge: 'Nouveau' };
}

function createTicket(userId, subject, message, category) {
  let id = uid();
  run("INSERT INTO tickets (id, user_id, subject, message, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))", [id, userId, subject, message, category || 'general']);
  return get("SELECT * FROM tickets WHERE id = ?", [id]);
}

function getUserTickets(userId) {
  return all("SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

function getAllTickets() {
  return all("SELECT t.*, u.username FROM tickets t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC");
}

function updateTicketStatus(ticketId, status, notes) {
  let resolved = status === 'resolved' ? new Date().toISOString() : null;
  run("UPDATE tickets SET status = ?, admin_notes = ?, resolved_at = ?, updated_at = datetime('now','localtime') WHERE id = ?", [status, notes || null, resolved, ticketId]);
  return get("SELECT * FROM tickets WHERE id = ?", [ticketId]);
}

function addTicketMessage(ticketId, userId, content, isAdmin) {
  run("INSERT INTO ticket_messages (id, ticket_id, user_id, content, is_admin) VALUES (?, ?, ?, ?, ?)", [uid(), ticketId, userId, content, isAdmin ? 1 : 0]);
  run("UPDATE tickets SET updated_at = datetime('now','localtime') WHERE id = ?", [ticketId]);
  return { id: uid(), content, is_admin: isAdmin ? 1 : 0 };
}

function getTicketMessages(ticketId) {
  return all("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC", [ticketId]);
}

function generateReferralCode(userId) {
  let code = Math.random().toString(36).substr(2, 8).toUpperCase();
  let existing = get("SELECT * FROM referrals WHERE code = ?", [code]);
  if (existing) return generateReferralCode(userId);
  let id = uid();
  run("INSERT INTO referrals (id, code, referrer_id) VALUES (?, ?, ?)", [id, code, userId]);
  return get("SELECT * FROM referrals WHERE id = ?", [id]);
}

function getReferralCode(userId) {
  return get("SELECT * FROM referrals WHERE referrer_id = ?", [userId]);
}

function useReferralCode(code, referredId) {
  let ref = get("SELECT * FROM referrals WHERE code = ?", [code]);
  if (!ref) return null;
  if (ref.referred_id) return null;
  if (ref.referrer_id === referredId) return null;
  run("UPDATE referrals SET referred_id = ?, used_count = used_count + 1 WHERE id = ?", [referredId, ref.id]);
  addPoints(ref.referrer_id, 100, 'Parrainage de ' + referredId);
  addPoints(referredId, 50, 'Utilisation du code ' + code);
  return get("SELECT * FROM referrals WHERE id = ?", [ref.id]);
}

function getReferralStats(userId) {
  return get("SELECT COUNT(*) as count, COALESCE(SUM(used_count),0) as used FROM referrals WHERE referrer_id = ?", [userId]);
}

function getTopReferrers(limit = 10) {
  return all("SELECT r.referrer_id as id, u.username, SUM(r.used_count) as count FROM referrals r LEFT JOIN users u ON r.referrer_id = u.id GROUP BY r.referrer_id ORDER BY count DESC LIMIT ?", [limit]);
}

function getUserBadges(userId) {
  let allb = all("SELECT * FROM badges");
  let unlockedSet = new Set(all("SELECT badge_id FROM user_badges WHERE user_id = ?", [userId]).map(r => r.badge_id));
  return allb.map(b => ({ ...b, unlocked: unlockedSet.has(b.id) }));
}

function checkAndUnlockBadges(userId) {
  let user = get("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) return;
  let allBadges = all("SELECT * FROM badges");
  let unlockedSet = new Set(all("SELECT badge_id FROM user_badges WHERE user_id = ?", [userId]).map(r => r.badge_id));
  for (let badge of allBadges) {
    if (unlockedSet.has(badge.id)) continue;
    let shouldUnlock = false;
    if (badge.name === 'Premiers Pas' && user.tasks_completed >= 1) shouldUnlock = true;
    if (badge.name === 'Collectionneur' && user.points >= 500) shouldUnlock = true;
    if (badge.name === 'Légende' && user.level >= 10) shouldUnlock = true;
    if (badge.name === 'Sociable' && user.invite_count >= 5) shouldUnlock = true;
    if (badge.name === 'Assidu' && user.daily_streak >= 7) shouldUnlock = true;
    if (badge.name === 'Dévoué' && user.tasks_completed >= 50) shouldUnlock = true;
    if (badge.name === 'Millionnaire' && user.points >= 1000000) shouldUnlock = true;
    if (badge.name === 'Vétéran' && user.level >= 50) shouldUnlock = true;
    if (shouldUnlock) {
      run("INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)", [userId, badge.id]);
      createNotification(userId, 'Badge débloqué : ' + badge.name, badge.description || '', 'reward');
    }
  }
}

function getUserNotifications(userId) {
  return all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [userId]);
}

function createNotification(userId, title, message, type) {
  let id = uid();
  run("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)", [id, userId, title, message, type || 'info']);
  return { id };
}

function markNotificationRead(notifId) {
  run("UPDATE notifications SET is_read = 1 WHERE id = ?", [notifId]);
}

function markAllNotificationsRead(userId) {
  run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
}

function getWeeklyActivity(userId) {
  let now = new Date();
  let weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  let ws = weekStart.toISOString();
  let act = get("SELECT * FROM weekly_activity WHERE user_id = ? AND week_start = ?", [userId, ws]);
  if (!act) {
    run("INSERT INTO weekly_activity (id, user_id, week_start) VALUES (?, ?, ?)", [uid(), userId, ws]);
    act = get("SELECT * FROM weekly_activity WHERE user_id = ? AND week_start = ?", [userId, ws]);
  }
  return act;
}

function updateWeeklyActivity(userId, points, xp, tasks) {
  let now = new Date();
  let weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  let ws = weekStart.toISOString();
  let act = get("SELECT * FROM weekly_activity WHERE user_id = ? AND week_start = ?", [userId, ws]);
  if (!act) {
    run("INSERT INTO weekly_activity (id, user_id, week_start, points, xp, tasks_done) VALUES (?, ?, ?, ?, ?, ?)", [uid(), userId, ws, points, xp, tasks || 0]);
  } else {
    run("UPDATE weekly_activity SET points = points + ?, xp = xp + ?, tasks_done = tasks_done + ? WHERE id = ?", [points, xp, tasks || 0, act.id]);
  }
}

function getUserTransactions(userId, limit = 20) {
  return all("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, limit]);
}

function getUserPurchases(userId) {
  return all("SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

function getShopItems() {
  return all("SELECT * FROM shop_items WHERE active = 1 ORDER BY created_at DESC");
}

function buyItem(userId, itemId) {
  let item = get("SELECT * FROM shop_items WHERE id = ? AND active = 1", [itemId]);
  if (!item) return null;
  let user = get("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  if (user.points < item.price) return null;
  if (item.stock > 0) {
    let remaining = get("SELECT COALESCE(SUM(1),0) as c FROM purchases WHERE item_id = ? AND status = 'completed'", [itemId]).c;
    if (remaining >= item.stock) return null;
  }
  run("UPDATE users SET points = points - ?, updated_at = datetime('now','localtime') WHERE id = ?", [item.price, userId]);
  run("INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)", [uid(), userId, 'purchase', -item.price, 'Achat: ' + item.name]);
  run("INSERT INTO purchases (id, user_id, item_id, item_name, item_type, price) VALUES (?, ?, ?, ?, ?, ?)", [uid(), userId, item.id, item.name, item.type, item.price]);
  return item;
}

function claimDaily(userId) {
  let user = get("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  let now = new Date();
  let last = user.last_daily ? new Date(user.last_daily) : null;
  let streak = user.daily_streak || 0;
  if (last) {
    let diff = (now - last) / (1000 * 60 * 60 * 24);
    if (diff < 1) return null;
    if (diff >= 2) streak = 0;
  }
  streak++;
  if (streak > 30) streak = 30;
  let reward = 100 + (streak - 1) * 25;
  run("UPDATE users SET points = points + ?, daily_streak = ?, last_daily = ?, updated_at = datetime('now','localtime') WHERE id = ?", [reward, streak, now.toISOString(), userId]);
  run("INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)", [uid(), userId, 'daily', reward, 'Daily récompense (streak: ' + streak + ')']);
  return { reward, streak };
}

function getQuests() {
  return all("SELECT * FROM quests WHERE active = 1");
}

function getRecentActivity(userId, limit = 10) {
  return all(`SELECT * FROM (
    SELECT created_at as date, type || ' ' || COALESCE(description,'') as text, type FROM transactions WHERE user_id = ?
    UNION ALL
    SELECT created_at, 'Notification: ' || title, 'notification' FROM notifications WHERE user_id = ?
  ) ORDER BY date DESC LIMIT ?`, [userId, userId, limit]);
}

module.exports = {
  init, getOrCreateUser, addPoints, setPoints, addXP, getLeaderboard,
  getGlobalStats, createTicket, getUserTickets, getAllTickets,
  updateTicketStatus, addTicketMessage, getTicketMessages,
  generateReferralCode, getReferralCode, useReferralCode,
  getReferralStats, getTopReferrers,
  getUserBadges, checkAndUnlockBadges,
  getUserNotifications, createNotification, markNotificationRead, markAllNotificationsRead,
  getWeeklyActivity, updateWeeklyActivity,
  getUserTransactions, getUserPurchases, getShopItems, buyItem,
  claimDaily, getQuests, getRecentActivity, uid
};
