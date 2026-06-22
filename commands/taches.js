import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getActiveTasks, completeUserTask, getUserTasks } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('taches')
    .setDescription('Affiche les tâches disponibles pour gagner des points'),

  async execute(interaction) {
    const tasks = await getActiveTasks();

    if (tasks.length === 0) {
      const noTasksEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Aucune tâche disponible')
        .setDescription('Aucune tâche n\'est disponible pour le moment. Revenez plus tard !')
        .setTimestamp();

      await interaction.reply({ embeds: [noTasksEmbed] });
      return;
    }

    const tasksList = tasks.map(task => {
      const typeEmoji = task.task_type === 'social' ? '📱' : task.task_type === 'activity' ? '💬' : task.task_type === 'invitation' ? '👥' : '📋';
      return `${typeEmoji} **${task.task_name}**\n   └ ${task.task_description}\n   └ Récompense : **${task.points_reward} points**`;
    }).join('\n\n');

    const tasksEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('📋 Tâches disponibles')
      .setDescription('Complétez ces tâches pour gagner des points !')
      .addFields(
        {
          name: '📦 Tâches',
          value: tasksList,
        },
        {
          name: '💡 Information',
          value: 'Utilisez `/completer-tache` pour soumettre une tâche.\nLes points seront ajoutés après validation par le staff.',
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Les tâches sont mises à jour régulièrement' });

    await interaction.reply({ embeds: [tasksEmbed] });
  },
};
