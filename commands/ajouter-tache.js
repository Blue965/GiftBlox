import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createTask } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ajouter-tache')
    .setDescription('Ajoute une nouvelle tâche (Owner uniquement)')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Le type de tâche')
        .setRequired(true)
        .addChoices(
          { name: '📱 Réseaux sociaux', value: 'social' },
          { name: '💬 Activité', value: 'activity' },
          { name: '👥 Invitation', value: 'invitation' },
          { name: '📋 Autre', value: 'other' },
        ),
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Le nom de la tâche')
        .setRequired(true),
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('La description de la tâche')
        .setRequired(true),
    )
    .addIntegerOption(option =>
      option
        .setName('points')
        .setDescription('La récompense en points')
        .setRequired(true)
        .setMinValue(1),
    )
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

    const taskType = interaction.options.getString('type');
    const taskName = interaction.options.getString('nom');
    const taskDescription = interaction.options.getString('description');
    const pointsReward = interaction.options.getInteger('points');

    try {
      const task = await createTask(taskType, taskName, taskDescription, pointsReward);

      const typeEmoji = taskType === 'social' ? '📱' : taskType === 'activity' ? '💬' : taskType === 'invitation' ? '👥' : '📋';

      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Tâche ajoutée avec succès')
        .setDescription(
          `La tâche a été ajoutée au système.\n\n` +
          `${typeEmoji} Type : **${taskType}**\n` +
          `📋 Nom : **${taskName}**\n` +
          `📝 Description : **${taskDescription}**\n` +
          `💰 Récompense : **${pointsReward} points**\n` +
          `🆔 ID : **${task.id}**`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Erreur lors de l\'ajout')
        .setDescription(
          `Une erreur est survenue lors de l'ajout de la tâche.\n\n` +
          `Erreur : ${error.message}`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
