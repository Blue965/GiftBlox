import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { countAvailableCodesByValue, getAvailableGiftTypes } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Affiche la boutique des récompenses disponibles'),

  async execute(interaction) {
    // Récupérer les types et valeurs disponibles avec leur stock
    const availableGifts = await getAvailableGiftTypes();
    const stockCounts = await countAvailableCodesByValue();

    // Créer un map pour compter le stock par type et valeur
    const stockMap = new Map();
    stockCounts.forEach(item => {
      const key = `${item.gift_type}-${item.gift_value}`;
      stockMap.set(key, item.count);
    });

    // Si aucun code n'est disponible
    if (availableGifts.length === 0) {
      const noStockEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🏪 Boutique')
        .setDescription('Aucune récompense n\'est disponible pour le moment. Revenez plus tard !')
        .setTimestamp();

      await interaction.reply({ embeds: [noStockEmbed] });
      return;
    }

    // Construire la liste des récompenses
    const rewardsList = availableGifts
      .map(gift => {
        const key = `${gift.giftType}-${gift.giftValue}`;
        const stock = stockMap.get(key) || 0;
        const typeEmoji = gift.giftType === 'robux' ? '💎' : gift.giftType === 'nitro' ? '🎮' : '🎁';
        const typeLabel = gift.giftType === 'robux' ? 'Robux' : gift.giftType === 'nitro' ? 'Nitro' : gift.giftType.charAt(0).toUpperCase() + gift.giftType.slice(1);
        return `${typeEmoji} **${typeLabel} - ${gift.giftValue}** - Coût : **${gift.pointsCost} points**\n   └ Stock disponible : **${stock}**`;
      })
      .join('\n\n');

    // Créer l'embed de la boutique
    const shopEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🏪 Boutique des Récompenses')
      .setDescription('Échangez vos points contre des codes cadeaux !')
      .addFields(
        {
          name: '📦 Récompenses disponibles',
          value: rewardsList,
        },
        {
          name: '💡 Information',
          value: 'Utilisez la commande `/acheter-carte` pour effectuer un achat.',
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Les stocks sont mis à jour en temps réel' });

    await interaction.reply({ embeds: [shopEmbed] });
  },
};
