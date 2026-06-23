import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Obtenir le lien vers votre tableau de bord GiftBlox'),

    async execute(interaction) {
        const dashboardUrl = process.env.DASHBOARD_URL || 'https://giftblox-ten.vercel.app/dashboard.html';
        
        const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎁 GiftBlox Dashboard')
            .setDescription('Accédez à votre tableau de bord personnel pour voir vos points, vos tâches et plus encore !')
            .addFields(
                { name: '🔗 Lien du Dashboard', value: `[Cliquez ici pour accéder au dashboard](${dashboardUrl})`, inline: false },
                { name: '📊 Fonctionnalités', value: '• Voir vos points et votre niveau\n• Consulter vos tâches disponibles\n• Accéder à la boutique\n• Voir votre historique', inline: false }
            )
            .setFooter({ text: 'GiftBlox - Votre bot de fidélité' })
            .setTimestamp();

        await interaction.reply({ 
            content: `Voici le lien vers votre dashboard : ${dashboardUrl}`,
            embeds: [embed],
            flags: [64] // Ephemeral flag
        });
    }
};
