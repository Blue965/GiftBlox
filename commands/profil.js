import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Affiche le profil avec le niveau, XP et points')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur dont vous voulez voir le profil (optionnel)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Récupérer l'utilisateur ciblé ou soi-même
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const userData = await getOrCreateUser(targetUser.id);

    // Calculer l'XP nécessaire pour le niveau actuel et le suivant
    const xpForCurrentLevel = (userData.level - 1) * 120;
    const xpForNextLevel = userData.level * 120;
    const xpProgress = userData.xp - xpForCurrentLevel;
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
      .setTitle(`👤 Profil de ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '📊 Niveau',
          value: `**${userData.level}**`,
          inline: true,
        },
        {
          name: '💰 Points',
          value: `**${userData.points}**`,
          inline: true,
        },
        {
          name: '⭐ XP',
          value: `**${userData.xp}** / ${xpForNextLevel}`,
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
