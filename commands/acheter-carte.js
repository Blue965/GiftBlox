import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateUser, purchaseGiftCode, getAvailableGiftCode, getAvailableGiftTypes } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('acheter-carte')
    .setDescription('Achète une carte cadeau avec vos points')
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
    ),

  async execute(interaction) {
    const giftType = interaction.options.getString('type');
    const giftValue = interaction.options.getInteger('valeur');

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
          `Vous n'avez pas assez de points pour acheter ce cadeau.\n\n` +
          `💰 Solde actuel : **${user.points} points**\n` +
          `💵 Coût : **${pointsCost} points**\n` +
          `❌ Manquant : **${pointsCost - user.points} points**`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [insufficientPointsEmbed], ephemeral: true });
      return;
    }

    // Vérifier si un code est disponible
    const availableCode = await getAvailableGiftCode(giftType, giftValue);
    if (!availableCode) {
      const outOfStockEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Rupture de stock')
        .setDescription(
          `Désolé, il n'y a plus de cadeaux de ce type disponibles.\n\n` +
          `Veuillez vérifier la boutique avec \`/boutique\` pour voir les disponibilités actuelles.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [outOfStockEmbed], ephemeral: true });
      return;
    }

    // Essayer d'envoyer le code par DM
    try {
      const typeLabel = giftType === 'robux' ? 'Robux' : giftType === 'nitro' ? 'Nitro' : giftType.charAt(0).toUpperCase() + giftType.slice(1);
      const typeEmoji = giftType === 'robux' ? '💎' : giftType === 'nitro' ? '🎮' : '🎁';

      const dmEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`🎁 Votre cadeau ${typeLabel}`)
        .setDescription(
          `Merci pour votre achat !\n\n` +
          `Voici votre code cadeau de **${typeLabel} - ${giftValue}** :`,
        )
        .addFields(
          {
            name: '🔐 Code secret',
            value: `||${availableCode.code}||`,
            inline: false,
          },
          {
            name: '💰 Coût',
            value: `**${pointsCost} points**`,
            inline: true,
          },
          {
            name: '📊 Valeur',
            value: `**${typeLabel} - ${giftValue}**`,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({ text: 'Gardez ce code en sécurité, il ne peut être utilisé qu\'une seule fois !' });

      await interaction.user.send({ embeds: [dmEmbed] });

      // Si le DM est envoyé avec succès, procéder à la transaction ACID
      const purchasedCode = await purchaseGiftCode(interaction.user.id, giftType, giftValue, pointsCost);

      if (purchasedCode) {
        const successEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Achat réussi !')
          .setDescription(
            `Votre achat a été effectué avec succès !\n\n` +
            `${typeEmoji} Cadeau : **${typeLabel} - ${giftValue}**\n` +
            `💵 Coût : **${pointsCost} points**\n` +
            `💰 Nouveau solde : **${user.points - pointsCost} points**\n\n` +
            `Le code vous a été envoyé par message privé.`,
          )
          .setTimestamp();

        await interaction.reply({ embeds: [successEmbed] });
      } else {
        // La transaction a échoué (ne devrait pas arriver si les vérifications précédentes sont correctes)
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Erreur lors de la transaction')
          .setDescription('Une erreur est survenue lors de la transaction. Veuillez réessayer.')
          .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (dmError) {
      // L'utilisateur a bloqué ses DMs
      const dmErrorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Messages privés désactivés')
        .setDescription(
          `Impossible de vous envoyer le code par message privé.\n\n` +
          `Veuillez activer vos messages privés pour les serveurs dans les paramètres de Discord, puis réessayez.\n\n` +
          `💡 Pour activer les DMs :\n` +
          `1. Allez dans Paramètres utilisateur\n` +
          `2. Confidentialité et sécurité\n` +
          `3. Activez "Autoriser les messages directs des membres du serveur"`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [dmErrorEmbed], ephemeral: true });
    }
  },
};
