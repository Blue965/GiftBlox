import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Affiche votre profil avec votre niveau, XP et points'),

  async execute(interaction) {
    // Récupérer ou créer l'utilisateur
    const user = await getOrCreateUser(interaction.user.id);

    // Calculer l'XP nécessaire pour le niveau actuel et le suivant
    const xpForCurrentLevel = (user.level - 1) * 120;
    const xpForNextLevel = user.level * 120;
    const xpProgress = user.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));

    // Créer la barre de progression
    const progressBarLength = 20;
    const filledBars = Math.floor((progressPercentage / 100) * progressBarLength);
    const emptyBars = progressBarLength - filledBars;
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

    // Créer l'embed du profil
    const profileEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`👤 Profil de ${interaction.user.username}`)
      .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '📊 Niveau',
          value: `**${user.level}**`,
          inline: true,
        },
        {
          name: '💰 Points',
          value: `**${user.points}**`,
          inline: true,
        },
        {
          name: '⭐ XP',
          value: `**${user.xp}** / ${xpForNextLevel}`,
          inline: false,
        },
        {
          name: '📈 Progression',
          value: `${progressBar} ${progressPercentage.toFixed(1)}%`,
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Continuez à être actif pour gagner plus de points !' });

    await interaction.reply({ embeds: [profileEmbed] });
  },
};
