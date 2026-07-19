require('dotenv/config');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('./database/db.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1513281082626281472';
const OWNER_ID = '1527668994210005002';
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder().setName('points').setDescription('Voir tes points'),
  new SlashCommandBuilder().setName('daily').setDescription('Réclamer ta récompense quotidienne'),
  new SlashCommandBuilder().setName('transfer').setDescription('Transférer des points').addUserOption(o => o.setName('user').setDescription('Le destinataire').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Montant').setRequired(true)),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Classement des joueurs'),
  new SlashCommandBuilder().setName('profile').setDescription('Voir ton profil'),
  new SlashCommandBuilder().setName('help').setDescription('Menu d\'aide'),
  new SlashCommandBuilder().setName('redeem').setDescription('Utiliser un code de parrainage').addStringOption(o => o.setName('code').setDescription('Code').setRequired(true)),
  new SlashCommandBuilder().setName('invites').setDescription('Voir tes invitations'),
  new SlashCommandBuilder().setName('stats').setDescription('Statistiques du serveur'),
  new SlashCommandBuilder().setName('shop').setDescription('Boutique'),
  new SlashCommandBuilder().setName('buy').setDescription('Acheter un item').addStringOption(o => o.setName('item').setDescription('ID de l\'item').setRequired(true)),
  new SlashCommandBuilder().setName('admin').setDescription('Panel admin').setDefaultMemberPermissions('8')
    .addSubcommand(s => s.setName('addpoints').setDescription('Ajouter des points').addUserOption(o => o.setName('user').setRequired(true)).addIntegerOption(o => o.setName('amount').setRequired(true)))
    .addSubcommand(s => s.setName('removepoints').setDescription('Retirer des points').addUserOption(o => o.setName('user').setRequired(true)).addIntegerOption(o => o.setName('amount').setRequired(true)))
    .addSubcommand(s => s.setName('setlevel').setDescription('Changer niveau').addUserOption(o => o.setName('user').setRequired(true)).addIntegerOption(o => o.setName('level').setRequired(true)))
    .addSubcommand(s => s.setName('givexp').setDescription('Donner XP').addUserOption(o => o.setName('user').setRequired(true)).addIntegerOption(o => o.setName('amount').setRequired(true))),
];

client.once('ready', async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    else await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Commandes enregistrées');
  } catch (e) { console.error('Erreur commandes:', e); }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName, user, options } = interaction;
  db.getOrCreateUser(user.id, user.username);

  try {
    switch (commandName) {
      case 'points': {
        let u = db.getOrCreateUser(user.id, user.username);
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('💰 Tes Points').setDescription(`**${u.points}** points\nNiveau **${u.level}** (${u.xp}/${u.level * 120} XP)`).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'daily': {
        let result = db.claimDaily(user.id);
        if (!result) {
          await interaction.reply({ content: 'Tu as déjà réclamé ta récompense aujourd\'hui !', ephemeral: true });
        } else {
          db.addXP(user.id, 10);
          db.checkAndUnlockBadges(user.id);
          const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('🎉 Récompense quotidienne').setDescription(`+ **${result.reward}** points !`).addFields({ name: 'Streak', value: `${result.streak} jours 🔥`, inline: true }).setFooter({ text: 'GiftBlox' }).setTimestamp();
          await interaction.reply({ embeds: [embed] });
        }
        break;
      }
      case 'transfer': {
        let target = options.getUser('user');
        let amount = options.getInteger('amount');
        let sender = db.getOrCreateUser(user.id, user.username);
        if (amount <= 0) return interaction.reply({ content: 'Montant invalide.', ephemeral: true });
        if (sender.points < amount) return interaction.reply({ content: 'Tu n\'as pas assez de points.', ephemeral: true });
        db.addPoints(user.id, -amount, 'Transfert à ' + target.username);
        db.addPoints(target.id, amount, 'Transfert de ' + user.username);
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('📤 Transfert').setDescription(`${user.username} a envoyé **${amount}** points à ${target.username}`).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'leaderboard': {
        let top = db.getLeaderboard(10);
        let desc = top.map((u, i) => `${['🥇','🥈','🥉'][i] || '#' + (i+1)} **${u.username}** — ${u.points} pts (niv. ${u.level})`).join('\n');
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('🏆 Classement').setDescription(desc).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'profile': {
        let u = db.getOrCreateUser(user.id, user.username);
        let transactions = db.getUserTransactions(user.id, 5);
        let badges = db.getUserBadges(user.id);
        let unlockedCount = badges.filter(b => b.unlocked).length;
        let recent = transactions.map(t => `${t.amount > 0 ? '🟢' : '🔴'} ${Math.abs(t.amount)} pts`).join('\n') || 'Aucune';
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle(user.username).setThumbnail(user.displayAvatarURL()).addFields(
          { name: '💰 Points', value: `${u.points}`, inline: true },
          { name: '⭐ Niveau', value: `${u.level}`, inline: true },
          { name: '🔥 Streak', value: `${u.daily_streak} jours`, inline: true },
          { name: '🏅 Badges', value: `${unlockedCount}/${badges.length}`, inline: true },
          { name: '📊 Activité récente', value: recent },
        ).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'help': {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId('help_menu').setPlaceholder('Choisis une catégorie').addOptions(
            { label: 'Général', value: 'general', emoji: '📖' },
            { label: 'Économie', value: 'economy', emoji: '💰' },
            { label: 'Admin', value: 'admin', emoji: '⚙️' },
          )
        );
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('📖 Aide GiftBlox').setDescription('Sélectionne une catégorie.').setFooter({ text: 'GiftBlox' });
        await interaction.reply({ embeds: [embed], components: [row] });
        break;
      }
      case 'redeem': {
        let code = options.getString('code').toUpperCase();
        let result = db.useReferralCode(code, user.id);
        if (!result) return interaction.reply({ content: 'Code invalide ou déjà utilisé.', ephemeral: true });
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('🎉 Code utilisé !').setDescription(`Tu as reçu **50** points !`).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'invites': {
        let stats = db.getReferralStats(user.id);
        let code = db.getReferralCode(user.id);
        let desc = code ? `**Code:** \`${code.code}\`\n**Utilisé:** ${stats.used || 0} fois` : 'Pas de code. Fais `/daily` 1 fois pour en générer un.';
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('👥 Invitations').setDescription(desc).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'stats': {
        let gs = db.getGlobalStats();
        let top = db.getLeaderboard(3);
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('📊 Statistiques').addFields(
          { name: '👥 Total', value: `${gs.totalUsers}`, inline: true },
          { name: '💰 Points', value: `${gs.totalPoints}`, inline: true },
          { name: '📋 Transactions', value: `${gs.totalTransactions}`, inline: true },
          { name: '🎫 Tickets', value: `${gs.ticketsOpen}`, inline: true },
          { name: '🏆 Top 3', value: top.map((u,i) => `${['🥇','🥈','🥉'][i]} ${u.username} — ${u.points} pts`).join('\n') || 'Aucun' },
        ).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'shop': {
        let items = db.getShopItems();
        if (items.length === 0) return interaction.reply({ content: 'Boutique vide pour le moment.', ephemeral: true });
        let desc = items.map((item, i) => `${i+1}. **${item.name}** — ${item.price} pts (stock: ${item.stock > 0 ? item.stock : '∞'})`).join('\n');
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('🛒 Boutique').setDescription(desc).setFooter({ text: 'Utilise /buy [item_id]' });
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'buy': {
        let itemId = options.getString('item');
        let result = db.buyItem(user.id, itemId);
        if (!result) return interaction.reply({ content: 'Achat impossible (points insuffisants, stock vide, ou item invalide).', ephemeral: true });
        db.addXP(user.id, 5);
        db.checkAndUnlockBadges(user.id);
        const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('✅ Achat réussi').setDescription(`Tu as acheté **${result.name}** pour ${result.price} pts !`).setFooter({ text: 'GiftBlox' }).setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case 'admin': {
        if (user.id !== OWNER_ID) return interaction.reply({ content: '⛔ Accès refusé.', ephemeral: true });
        let sub = options.getSubcommand();
        let target = options.getUser('user');
        let amount = options.getInteger('amount') || options.getInteger('level');
        if (sub === 'addpoints') { db.addPoints(target.id, amount, 'Admin: ajout'); await interaction.reply({ content: `✅ ${amount} points ajoutés à ${target.username}` }); }
        if (sub === 'removepoints') { db.addPoints(target.id, -amount, 'Admin: retrait'); await interaction.reply({ content: `✅ ${amount} points retirés` }); }
        if (sub === 'setlevel') { await interaction.reply({ content: `✅ Niveau changé` }); }
        if (sub === 'givexp') { db.addXP(target.id, amount); await interaction.reply({ content: `✅ ${amount} XP donnés à ${target.username}` }); }
        break;
      }
    }
  } catch (e) {
    console.error('Erreur commande:', commandName, e.message);
    try { await interaction.reply({ content: 'Erreur lors de l\'exécution.', ephemeral: true }); } catch(ex) {}
  }
});

async function start() {
  await db.init();
  client.login(TOKEN);
}

start();
