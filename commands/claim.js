import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser, deductUserPoints, createPaymentRequest, getAvailableGiftTypes, updatePaymentRequestMessage, verifyRobloxUsername } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Demande un paiement Robux avec vos points')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Le type de cadeau')
        .setRequired(true)
        .addChoices(
          { name: '💎 Robux', value: 'robux' },
          { name: '🎮 Nitro', value: 'nitro' },
          { name: '🎁 Autre', value: 'autre' },
        ),
    )
    .addIntegerOption(option =>
      option
        .setName('valeur')
        .setDescription('La valeur du cadeau')
        .setRequired(true)
        .setMinValue(1),
    )
    .addStringOption(option =>
      option
        .setName('roblox_username')
        .setDescription('Votre pseudo Roblox')
        .setRequired(true),
    ),

  async execute(interaction) {
    const giftType = interaction.options.getString('type');
    const giftValue = interaction.options.getInteger('valeur');
    const robloxUsername = interaction.options.getString('roblox_username');

    // Vérifier si le pseudo Roblox existe
    const usernameExists = await verifyRobloxUsername(robloxUsername);
    if (!usernameExists) {
      const invalidUsernameEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Pseudo Roblox invalide')
        .setDescription(
          `Le pseudo Roblox "${robloxUsername}" n'existe pas.\n\n` +
          `Veuillez vérifier votre pseudo et réessayer.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [invalidUsernameEmbed], ephemeral: true });
      return;
    }

    // Récupérer les cadeaux disponibles pour obtenir le coût en points
    const availableGifts = await getAvailableGiftTypes();
    const selectedGift = availableGifts.find(g => g.giftType === giftType && g.giftValue === giftValue);

    if (!selectedGift) {
      const notAvailableEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Cadeau non disponible')
        .setDescription(
          `Désolé, ce cadeau n'est pas disponible.\n\n` +
          `Veuillez vérifier la boutique avec \`/boutique\` pour voir les disponibilités actuelles.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [notAvailableEmbed], ephemeral: true });
      return;
    }

    const pointsCost = selectedGift.pointsCost;

    // Récupérer l'utilisateur
    const user = await getOrCreateUser(interaction.user.id);

    // Vérifier si l'utilisateur a assez de points
    if (user.points < pointsCost) {
      const insufficientPointsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Solde insuffisant')
        .setDescription(
          `Vous n'avez pas assez de points pour demander ce cadeau.\n\n` +
          `💰 Solde actuel : **${user.points} points**\n` +
          `💵 Coût : **${pointsCost} points**\n` +
          `❌ Manquant : **${pointsCost - user.points} points**`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [insufficientPointsEmbed], ephemeral: true });
      return;
    }

    // Déduire les points immédiatement pour éviter la fraude
    await deductUserPoints(interaction.user.id, pointsCost);

    // Créer la demande de paiement
    const paymentRequest = await createPaymentRequest(
      interaction.user.id,
      interaction.user.username,
      robloxUsername,
      giftType,
      giftValue,
      pointsCost
    );

    // Envoyer la demande au salon staff (à configurer)
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
      
      const typeLabel = giftType === 'robux' ? 'Robux' : giftType === 'nitro' ? 'Nitro' : giftType.charAt(0).toUpperCase() + giftType.slice(1);
      const typeEmoji = giftType === 'robux' ? '💎' : giftType === 'nitro' ? '🎮' : '🎁';

      const staffEmbed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle('🎁 NOUVELLE DEMANDE DE PAIEMENT - GIFTBLOX')
        .setDescription('Une nouvelle demande de paiement doit être validée.')
        .addFields(
          { name: '👤 Utilisateur Discord', value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: true },
          { name: '🎮 Pseudo Roblox', value: robloxUsername, inline: true },
          { name: '🎁 Type', value: `${typeEmoji} ${typeLabel}`, inline: true },
          { name: '📊 Valeur', value: `**${giftValue}**`, inline: true },
          { name: '💰 Coût en points', value: `**${pointsCost} points**`, inline: true },
          { name: '🆔 ID Demande', value: `**${paymentRequest.id}**`, inline: true },
          { name: '⏳ Statut', value: '**En attente de validation**', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: 'Cliquez sur un bouton ci-dessous pour valider ou annuler' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`mark_paid_${paymentRequest.id}`)
            .setLabel('✅ Marquer comme Payé')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`cancel_${paymentRequest.id}`)
            .setLabel('❌ Annuler / Rembourser')
            .setStyle(ButtonStyle.Danger),
        );

      const staffMessage = await staffChannel.send({ embeds: [staffEmbed], components: [row] });

      // Mettre à jour la demande avec les informations du message
      await updatePaymentRequestMessage(paymentRequest.id, staffChannelId, staffMessage.id);

      // Confirmer à l'utilisateur
      const confirmEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Demande envoyée')
        .setDescription(
          `Votre demande de paiement a été envoyée au staff.\n\n` +
          `${typeEmoji} Cadeau : **${typeLabel} - ${giftValue}**\n` +
          `💵 Coût : **${pointsCost} points** (déduits de votre solde)\n` +
          `🎮 Pseudo Roblox : **${robloxUsername}**\n\n` +
          `⏳ Votre demande est en attente de validation par le staff.\n` +
          `Vous recevrez une notification quand le paiement sera effectué.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [confirmEmbed] });
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
