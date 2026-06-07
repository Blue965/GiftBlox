import { Collection } from 'discord.js';
import {
  getOrCreateUser,
  updateUserPointsAndXP,
  updateUserLevel,
} from '../database/database.js';

// Cooldown en mémoire pour empêcher le spam (60 secondes par utilisateur)
const cooldowns = new Collection();

/**
 * Gestionnaire d'événement messageCreate
 * Attribue de l'XP et des points aux utilisateurs pour leur activité textuelle
 */
export default {
  name: 'messageCreate',
  async execute(message) {
    // Ignorer les messages des bots
    if (message.author.bot) return;

    // Ignorer les messages privés (uniquement les serveurs)
    if (!message.guild) return;

    const userId = message.author.id;

    // Vérifier le cooldown de l'utilisateur
    const now = Date.now();
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + 60000; // 60 secondes
      if (now < expirationTime) {
        return; // L'utilisateur est en cooldown
      }
    }

    // Mettre à jour le cooldown
    cooldowns.set(userId, now);

    // Générer un montant aléatoire d'XP entre 15 et 25
    const xpGained = Math.floor(Math.random() * 11) + 15; // 15 à 25
    const pointsGained = 1;

    // Récupérer ou créer l'utilisateur
    const user = await getOrCreateUser(userId);

    // Calculer l'XP nécessaire pour le niveau suivant
    const xpNeededForNextLevel = user.level * 120;
    const previousXp = user.xp;

    // Mettre à jour les points et l'XP
    const updatedUser = await updateUserPointsAndXP(userId, pointsGained, xpGained);

    // Vérifier si l'utilisateur a monté de niveau
    if (previousXp < xpNeededForNextLevel && updatedUser.xp >= xpNeededForNextLevel) {
      const newLevel = updatedUser.level + 1;
      await updateUserLevel(userId, newLevel);

      // Envoyer un message stylé pour le level up
      const levelUpEmbed = {
        color: 0x00ff00,
        title: '🎉 LEVEL UP !',
        description: `Félicitations ${message.author} !`,
        fields: [
          {
            name: 'Nouveau niveau',
            value: `**${newLevel}**`,
            inline: true,
          },
          {
            name: 'XP total',
            value: `**${updatedUser.xp}**`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Continuez à être actif pour gagner plus de points !',
        },
      };

      message.channel.send({ embeds: [levelUpEmbed] });
    }
  },
};
