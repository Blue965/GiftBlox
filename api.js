require('dotenv/config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk');
const db = require('./database/db.js');

const app = express();
const PORT = process.env.API_PORT || 3001;
const OWNER_ID = '1527668994210005002';
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'website')));

// Health
app.get('/api/health', (_, res) => res.json({ success: true, status: 'ok' }));

// User
app.get('/api/user/:userId', (req, res) => {
  let user = db.getOrCreateUser(req.params.userId);
  let weekly = db.getWeeklyActivity(req.params.userId);
  let badges = db.getUserBadges(req.params.userId);
  let recent = db.getRecentActivity(req.params.userId, 5);
  res.json({ success: true, data: {
    userId: user.id, username: user.username, points: user.points, level: user.level, xp: user.xp,
    tasksCompleted: user.tasks_completed, dailyStreak: user.daily_streak, inviteCount: user.invite_count,
    role: user.role, isAdmin: user.id === OWNER_ID,
    weeklyActivity: { points: weekly ? [weekly.points] : [], xp: weekly ? [weekly.xp] : [] },
    recentActivity: recent, badges
  }});
});

// Notifications
app.get('/api/notifications/:userId', (req, res) => {
  res.json({ success: true, notifications: db.getUserNotifications(req.params.userId) });
});

app.post('/api/notifications/:userId/read', (req, res) => {
  let { id, all } = req.body;
  if (all) db.markAllNotificationsRead(req.params.userId);
  else if (id) db.markNotificationRead(id);
  res.json({ success: true });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  let limit = Math.min(parseInt(req.query.limit) || 10, 50);
  let data = db.getLeaderboard(limit);
  res.json({ success: true, data: data.map((u, i) => ({ ...u, rank: i + 1 })) });
});

// Global stats
app.get('/api/global-stats', (req, res) => {
  res.json({ success: true, ...db.getGlobalStats() });
});

// Tickets
app.get('/api/tickets', (req, res) => {
  if (req.query.userId) res.json({ success: true, tickets: db.getUserTickets(req.query.userId) });
  else res.json({ success: true, tickets: db.getAllTickets() });
});

app.post('/api/tickets', (req, res) => {
  let { userId, subject, message, category } = req.body;
  let ticket = db.createTicket(userId, subject, message, category);
  res.json({ success: true, ticket });
});

app.post('/api/tickets/:id/status', (req, res) => {
  let ticket = db.updateTicketStatus(req.params.id, req.body.status, req.body.notes);
  res.json({ success: true, ticket });
});

app.get('/api/tickets/:id/messages', (req, res) => {
  res.json({ success: true, messages: db.getTicketMessages(req.params.id) });
});

app.post('/api/tickets/:id/messages', (req, res) => {
  let msg = db.addTicketMessage(req.params.id, req.body.userId, req.body.content, req.body.isAdmin || false);
  res.json({ success: true, message: msg });
});

// Referrals
app.get('/api/referral/:userId', (req, res) => {
  let code = db.getReferralCode(req.params.userId);
  let stats = db.getReferralStats(req.params.userId);
  res.json({ success: true, code, stats });
});

app.post('/api/referral/generate', (req, res) => {
  let code = db.generateReferralCode(req.body.userId);
  res.json({ success: true, code });
});

app.post('/api/referral/use', (req, res) => {
  let result = db.useReferralCode(req.body.code, req.body.userId);
  res.json({ success: true, result });
});

app.get('/api/referral/top', (req, res) => {
  res.json({ success: true, data: db.getTopReferrers(10) });
});

// Shop
app.get('/api/shop', (_, res) => {
  res.json({ success: true, items: db.getShopItems() });
});

app.post('/api/buy', (req, res) => {
  let result = db.buyItem(req.body.userId, req.body.itemId);
  if (!result) return res.json({ success: false, error: 'Achat impossible' });
  res.json({ success: true, item: result });
});

// Transactions
app.get('/api/user/:userId/transactions', (req, res) => {
  res.json({ success: true, transactions: db.getUserTransactions(req.params.userId) });
});

app.get('/api/user/:userId/purchases', (req, res) => {
  res.json({ success: true, purchases: db.getUserPurchases(req.params.userId) });
});

// Quests
app.get('/api/quests', (req, res) => {
  res.json({ success: true, quests: db.getQuests() });
});

// Daily
app.post('/api/daily/claim', (req, res) => {
  let result = db.claimDaily(req.body.userId);
  if (!result) return res.json({ success: false, error: 'Déjà réclamé aujourd\'hui' });
  res.json({ success: true, reward: result.reward, streak: result.streak });
});

// IA
app.post('/api/ia/chat', async (req, res) => {
  if (!groq) return res.json({ reply: 'IA désactivée (clé API manquante).' });
  let { message, discordId } = req.body;
  let user = discordId ? db.getOrCreateUser(discordId) : null;
  try {
    let completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Tu es GiftBot, assistant du serveur GiftBlox. Tu es sympa, utilise des emojis, réponds en français. ' + (user ? 'L\'utilisateur a ' + user.points + ' points, niveau ' + user.level + '.' : '') },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });
    res.json({ reply: completion.choices[0]?.message?.content || 'Pas de réponse.' });
  } catch (e) {
    console.error('Erreur Groq:', e);
    res.json({ reply: 'Désolé, une erreur est survenue.' });
  }
});

// Admin stats
app.get('/api/admin/stats', (req, res) => {
  let gs = db.getGlobalStats();
  let topUsers = db.getLeaderboard(5);
  let recentTx = [];
  try { recentTx = db.getUserTransactions('all', 10); } catch(e) {}
  res.json({ success: true, ...gs, topUsers, recentTransactions: recentTx });
});

// Catch-all SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'dashboard.html'));
});

async function start() {
  await db.init();
  app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
}

start();
