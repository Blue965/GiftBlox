import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getActiveTasks, completeUserTask, getUserTasks, updatePaymentRequestMessage } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('completer-tache')
    .setDescription('Soumet une tâche comme complétée pour gagner des points')
    .addIntegerOption(option =>
      option
        .setName('id_tache')
        .setDescription('L\'ID de la tâche à compléter')
        .setRequired(true)
        .setMinValue(1),
    )
    .addStringOption(option =>
      option
        .setName('preuve')
        .setDescription('L\'URL de la preuve (capture d\'écran, lien, etc.)')
        .setRequired(false),
    ),

  async execute(interaction) {
    const taskId = interaction.options.getInteger('id_tache');
    const proofUrl = interaction.options.getString('preuve');

    // Récupérer la tâche
    const tasks = await getActiveTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      const invalidTaskEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Tâche invalide')
        .setDescription(
          `La tâche avec l'ID ${taskId} n'existe pas ou n'est pas active.\n\n` +
          `Utilisez /taches pour voir les tâches disponibles.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [invalidTaskEmbed], ephemeral: true });
      return;
    }

    // Vérifier si l'utilisateur a déjà complété cette tâche
    const userTasks = await getUserTasks(interaction.user.id);
    const alreadyCompleted = userTasks.find(ut => ut.task_id === taskId && ut.status === 'approved');

    if (alreadyCompleted) {
      const alreadyCompletedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Tâche déjà complétée')
        .setDescription(
          `Vous avez déjà complété cette tâche.\n\n` +
          `Vous ne pouvez compléter chaque tâche qu'une seule fois.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [alreadyCompletedEmbed], ephemeral: true });
      return;
    }

    // Marquer la tâche comme complétée
    const userTask = await completeUserTask(interaction.user.id, taskId, proofUrl);

    if (!userTask) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Erreur')
        .setDescription(
          `Une erreur est survenue lors de la soumission de votre tâche.\n\n` +
          `Vous avez peut-être déjà une demande en attente pour cette tâche.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const typeEmoji = task.task_type === 'social' ? '📱' : task.task_type === 'activity' ? '💬' : task.task_type === 'invitation' ? '👥' : '📋';

    // Envoyer la demande au salon staff
    const staffChannelId = process.env.STAFF_CHANNEL_ID;
    if (!staffChannelId) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Configuration manquante')
        .setDescription('Le salon staff n\'est pas configuré. Contactez l\'administrateur.')
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    try {
      const staffChannel = await interaction.client.channels.fetch(staffChannelId);
      
      const staffEmbed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle('📋 NOUVELLE TÂCHE À VALIDER')
        .setDescription('Une nouvelle tâche doit être validée.')
        .addFields(
          { name: '👤 Utilisateur Discord', value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: true },
          { name: '📋 Tâche', value: task.task_name, inline: true },
          { name: '📝 Description', value: task.task_description, inline: true },
          { name: '💰 Récompense', value: `**${task.points_reward} points**`, inline: true },
          { name: '🆔 ID Demande', value: `**${userTask.id}**`, inline: true },
          { name: '🔗 Preuve', value: proofUrl || 'Aucune', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Cliquez sur un bouton ci-dessous pour valider ou rejeter' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`approve_task_${userTask.id}`)
            .setLabel('✅ Approuver')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`reject_task_${userTask.id}`)
            .setLabel('❌ Rejeter')
            .setStyle(ButtonStyle.Danger),
        );

      const staffMessage = await staffChannel.send({ embeds: [staffEmbed], components: [row] });

      // Confirmer à l'utilisateur
      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Tâche soumise')
        .setDescription(
          `Votre tâche a été soumise pour validation.\n\n` +
          `${typeEmoji} Tâche : **${task.task_name}**\n` +
          `💰 Récompense : **${task.points_reward} points**\n\n` +
          `⏳ Votre demande est en attente de validation par le staff.\n` +
          `Vous recevrez une notification quand la validation sera terminée.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Erreur lors de l\'envoi au salon staff:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Erreur')
        .setDescription('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez contacter l\'administrateur.')
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
