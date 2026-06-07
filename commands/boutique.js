import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { countAvailableCodesByValue, getAvailableRobuxValues } from '../database/database.js';

// Taux de conversion : 1 Robux = 10 points
const POINTS_PER_ROBUX = 10;

export default {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Affiche la boutique des récompenses disponibles'),

  async execute(interaction) {
    // Récupérer les valeurs disponibles et leur stock
    const availableValues = await getAvailableRobuxValues();
    const stockCounts = await countAvailableCodesByValue();

    // Créer un map pour compter le stock par valeur
    const stockMap = new Map();
    stockCounts.forEach(item => {
      stockMap.set(item.robux_value, item.count);
    });

    // Si aucun code n'est disponible
    if (availableValues.length === 0) {
      const noStockEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🏪 Boutique')
        .setDescription('Aucune récompense n\'est disponible pour le moment. Revenez plus tard !')
        .setTimestamp();

      await interaction.reply({ embeds: [noStockEmbed] });
      return;
    }

    // Construire la liste des récompenses
    const rewardsList = availableValues
      .map(robuxValue => {
        const pointsCost = robuxValue * POINTS_PER_ROBUX;
        const stock = stockMap.get(robuxValue) || 0;
        return `🎁 **Carte ${robuxValue} Robux** - Coût : **${pointsCost} points**\n   └ Stock disponible : **${stock}**`;
      })
      .join('\n\n');

    // Créer l'embed de la boutique
    const shopEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🏪 Boutique des Récompenses')
      .setDescription('Échangez vos points contre des codes cadeaux Roblox !')
      .addFields(
        {
          name: '📦 Récompenses disponibles',
          value: rewardsList,
        },
        {
          name: '💡 Information',
          value: `Taux de conversion : **1 Robux = ${POINTS_PER_ROBUX} points**\nUtilisez la commande \`/acheter-carte\` pour effectuer un achat.`,
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Les stocks sont mis à jour en temps réel' });

    await interaction.reply({ embeds: [shopEmbed] });
  },
};
