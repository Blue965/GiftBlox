import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('regles')
    .setDescription('Affiche les règles et avertissements du système de fidélité'),

  async execute(interaction) {
    const rulesEmbed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle('📜 Règles et Avertissements')
      .setDescription('Informations importantes sur le fonctionnement du système de fidélité')
      .addFields(
        {
          name: '🎯 Comment ça marche ?',
          value:
            '1. Gagnez des points en envoyant des messages (1 point + 15-25 XP par message)\n' +
            '2. Utilisez `/boutique` pour voir les récompenses disponibles\n' +
            '3. Achetez une carte cadeau avec vos points via `/acheter-carte`\n' +
            '4. Recevez le code par message privé et activez-le sur roblox.com/redeem',
          inline: false,
        },
        {
          name: '⚠️ AVERTISSEMENT IMPORTANT',
          value:
            '**La validité des codes cadeaux dépend entièrement de l\'administrateur du serveur.**\n\n' +
            'Ce bot est un outil de distribution de codes. L\'administrateur DOIT :\n' +
            '• Acheter réellement les cartes cadeaux Roblox\n' +
            '• Ajouter des codes valides et non utilisés\n' +
            '• Ne pas réutiliser les codes déjà distribués\n\n' +
            'Si l\'administrateur ne respecte pas ces règles, les codes fournis pourraient être invalides.',
          inline: false,
        },
        {
          name: '💰 Taux de conversion',
          value: '1 Robux = 10 points',
          inline: true,
        },
        {
          name: '⏱️ Cooldown',
          value: '60 secondes entre chaque message pour gagner des points',
          inline: true,
        },
        {
          name: '🔒 Sécurité',
          value:
            'Ce bot n\'utilise AUCUNE API Roblox ni aucun cookie. Les codes sont stockés localement dans une base de données sécurisée.',
          inline: false,
        },
        {
          name: '📧 Messages privés',
          value:
            'Pour recevoir votre code cadeau, vous devez activer vos messages privés. Si vos DMs sont désactivés, l\'achat échouera et vos points ne seront pas déduits.',
          inline: false,
        },
        {
          name: '🛡️ Protection',
          value:
            '• Transaction sécurisée : les points ne sont déduits que si le DM est envoyé avec succès\n' +
            '• Code caché dans le DM pour éviter le vol\n' +
            '• Stock en temps réel dans la boutique',
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({
        text: 'En cas de problème avec un code, contactez l\'administrateur du serveur',
      });

    await interaction.reply({ embeds: [rulesEmbed] });
  },
};
