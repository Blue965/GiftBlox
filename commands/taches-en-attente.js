import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getPendingUserTasks } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('taches-en-attente')
    .setDescription('Affiche les tâches en attente de validation (Staff uniquement)')
    .setDefaultMemberPermissions(0),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      const unauthorizedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Accès refusé')
        .setDescription('Cette commande est réservée au propriétaire du bot uniquement.')
        .setTimestamp();

      await interaction.reply({ embeds: [unauthorizedEmbed], ephemeral: true });
      return;
    }

    const pendingTasks = await getPendingUserTasks();

    if (pendingTasks.length === 0) {
      const noTasksEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Aucune tâche en attente')
        .setDescription('Aucune tâche n\'est en attente de validation.')
        .setTimestamp();

      await interaction.reply({ embeds: [noTasksEmbed], ephemeral: true });
      return;
    }

    const tasksList = pendingTasks.map(task => {
      return `👤 **${task.discord_username}**\n   └ Tâche : **${task.task_name}**\n   └ Récompense : **${task.points_reward} points**\n   └ ID : **${task.id}**`;
    }).join('\n\n');

    const tasksEmbed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle('📋 Tâches en attente de validation')
      .setDescription(`${pendingTasks.length} tâche(s) en attente de validation.`)
      .addFields(
        {
          name: '📦 Tâches',
          value: tasksList,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Utilisez les boutons dans les messages individuels pour valider' });

    await interaction.reply({ embeds: [tasksEmbed], ephemeral: true });
  },
};
