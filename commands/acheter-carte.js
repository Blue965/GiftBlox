import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateUser, purchaseGiftCode, getAvailableGiftCode } from '../database/database.js';

// Taux de conversion : 1 Robux = 10 points
const POINTS_PER_ROBUX = 10;

export default {
  data: new SlashCommandBuilder()
    .setName('acheter-carte')
    .setDescription('Achète une carte cadeau Roblox avec vos points')
    .addIntegerOption(option =>
      option
        .setName('valeur_robux')
        .setDescription('La valeur en Robux de la carte souhaitée')
        .setRequired(true)
        .addChoices(
          { name: '100 Robux', value: 100 },
          { name: '200 Robux', value: 200 },
          { name: '400 Robux', value: 400 },
          { name: '800 Robux', value: 800 },
          { name: '1000 Robux', value: 1000 },
          { name: '1600 Robux', value: 1600 },
          { name: '2000 Robux', value: 2000 },
          { name: '4500 Robux', value: 4500 },
        ),
    ),

  async execute(interaction) {
    const robuxValue = interaction.options.getInteger('valeur_robux');
    const pointsCost = robuxValue * POINTS_PER_ROBUX;

    // Récupérer l'utilisateur
    const user = await getOrCreateUser(interaction.user.id);

    // Vérifier si l'utilisateur a assez de points
    if (user.points < pointsCost) {
      const insufficientPointsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Solde insuffisant')
        .setDescription(
          `Vous n'avez pas assez de points pour acheter cette carte.\n\n` +
          `💰 Solde actuel : **${user.points} points**\n` +
          `💵 Coût : **${pointsCost} points**\n` +
          `❌ Manquant : **${pointsCost - user.points} points**`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [insufficientPointsEmbed], ephemeral: true });
      return;
    }

    // Vérifier si un code est disponible
    const availableCode = await getAvailableGiftCode(robuxValue);
    if (!availableCode) {
      const outOfStockEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Rupture de stock')
        .setDescription(
          `Désolé, il n'y a plus de cartes de **${robuxValue} Robux** disponibles.\n\n` +
          `Veuillez vérifier la boutique avec \`/boutique\` pour voir les disponibilités actuelles.`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [outOfStockEmbed], ephemeral: true });
      return;
    }

    // Essayer d'envoyer le code par DM
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎁 Votre carte cadeau Roblox')
        .setDescription(
          `Merci pour votre achat !\n\n` +
          `Voici votre code cadeau de **${robuxValue} Robux** :`,
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
            value: `**${robuxValue} Robux**`,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({ text: 'Gardez ce code en sécurité, il ne peut être utilisé qu\'une seule fois !' });

      await interaction.user.send({ embeds: [dmEmbed] });

      // Si le DM est envoyé avec succès, procéder à la transaction ACID
      const purchasedCode = await purchaseGiftCode(interaction.user.id, robuxValue, pointsCost);

      if (purchasedCode) {
        const successEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Achat réussi !')
          .setDescription(
            `Votre achat a été effectué avec succès !\n\n` +
            `🎁 Carte : **${robuxValue} Robux**\n` +
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
