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
          name: '🎯 Comment gagner des points ?',
          value:
            '• Envoyez des messages dans le serveur (1 point + 15-25 XP par message)\n' +
            '• Complétez des tâches disponibles (réseaux sociaux, invitations, etc.)\n' +
            '• Cooldown de 60 secondes entre chaque message\n' +
            '• Montez de niveau pour débloquer plus de récompenses',
          inline: false,
        },
        {
          name: '📋 Système de tâches',
          value:
            '• Utilisez `/taches` pour voir les tâches disponibles\n' +
            '• Utilisez `/completer-tache` pour soumettre une tâche complétée\n' +
            '• Le staff valide chaque tâche manuellement\n' +
            '• Les points sont ajoutés après validation\n' +
            '• Chaque tâche ne peut être complétée qu\'une seule fois',
          inline: false,
        },
        {
          name: '💰 Système de paiement sécurisé',
          value:
            '**Nouveau système : Click-to-Approve**\n\n' +
            '1. Utilisez `/claim` pour demander un paiement (Robux, Nitro, etc.)\n' +
            '2. Indiquez votre pseudo Roblox et la valeur souhaitée\n' +
            '3. Vos points sont déduits immédiatement (anti-fraude)\n' +
            '4. Votre demande est envoyée au staff pour validation\n' +
            '5. Le staff valide manuellement sur Roblox (One-time Payout)\n' +
            '6. Vous recevez une notification quand le paiement est effectué',
          inline: false,
        },
        {
          name: '� Pourquoi ce système est sécurisé ?',
          value:
            '• **Aucun mot de passe Roblox** n\'est stocké dans le bot\n' +
            '• **Pas d\'automatisation** : le staff confirme chaque paiement manuellement\n' +
            '• **Respect des règles Roblox** : aucun script tiers ne se connecte à leurs serveurs\n' +
            '• **Anti-fraude** : les points sont déduits avant validation\n' +
            '• **Remboursement automatique** si le staff annule la demande',
          inline: false,
        },
        {
          name: '� Boutique de récompenses',
          value:
            '• Utilisez `/boutique` pour voir les récompenses disponibles\n' +
            '• Différents types : Robux, Nitro, et autres cadeaux\n' +
            '• Chaque récompense a un coût en points spécifique\n' +
            '• Stock mis à jour en temps réel',
          inline: false,
        },
        {
          name: '⚠️ Règles importantes',
          value:
            '• **Pas de spam** : respectez le cooldown de 60 secondes\n' +
            '• **Pseudo Roblox correct** : assurez-vous que votre pseudo est exact\n' +
            '• **Une demande à la fois** : attendez la validation avant de faire une nouvelle demande\n' +
            '• **DMs activés** : activez vos messages privés pour recevoir les notifications',
          inline: false,
        },
        {
          name: '🛡️ Protection et sécurité',
          value:
            '• Base de données locale sécurisée\n' +
            '• Aucune API Roblox ni cookie stocké\n' +
            '• Validation manuelle par le staff\n' +
            '• Remboursement automatique en cas d\'annulation',
          inline: false,
        },
        {
          name: '📧 Support',
          value:
            'En cas de problème avec un paiement ou une demande, contactez le staff du serveur.\n\n' +
            '⚠️ **Note** : La validité des paiements dépend entièrement de l\'administrateur qui effectue les virements sur Roblox.',
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({
        text: 'GiftBlox - Système de fidélité sécurisé',
      });

    await interaction.reply({ embeds: [rulesEmbed] });
  },
};
