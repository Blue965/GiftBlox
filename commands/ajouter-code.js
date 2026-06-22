import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addGiftCode } from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ajouter-code')
    .setDescription('Ajoute un nouveau code cadeau à la boutique (Owner uniquement)')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Le code du cadeau à ajouter')
        .setRequired(true),
    )
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
    )
    .addIntegerOption(option =>
      option
        .setName('cout_points')
        .setDescription('Le coût en points')
        .setRequired(true)
        .setMinValue(1),
    )
    .setDefaultMemberPermissions(0), // Désactive les permissions par défaut pour cacher la commande aux membres

  async execute(interaction) {
    // Vérifier si l'utilisateur est le propriétaire du bot
    if (interaction.user.id !== process.env.OWNER_ID) {
      const unauthorizedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Accès refusé')
        .setDescription('Cette commande est réservée au propriétaire du bot uniquement.')
        .setTimestamp();

      await interaction.reply({ embeds: [unauthorizedEmbed], ephemeral: true });
      return;
    }

    const code = interaction.options.getString('code');
    const giftType = interaction.options.getString('type');
    const giftValue = interaction.options.getInteger('valeur');
    const pointsCost = interaction.options.getInteger('cout_points');

    // Ajouter le code à la base de données
    try {
      const addedCode = await addGiftCode(code, giftType, giftValue, pointsCost);

      const typeLabel = giftType === 'robux' ? 'Robux' : giftType === 'nitro' ? 'Nitro' : giftType.charAt(0).toUpperCase() + giftType.slice(1);

      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Code ajouté avec succès')
        .setDescription(
          `Le code cadeau a été ajouté à la boutique.\n\n` +
          `🔐 Code : ||${addedCode.code}||\n` +
          `🎁 Type : **${typeLabel}**\n` +
          `📊 Valeur : **${giftValue}**\n` +
          `💰 Coût en points : **${pointsCost}**\n` +
          `🆔 ID : **${addedCode.id}**\n` +
          `📈 Statut : **${addedCode.status}**`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      // Erreur probablement due à un code en double
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Erreur lors de l\'ajout')
        .setDescription(
          `Une erreur est survenue lors de l'ajout du code.\n\n` +
          `Vérifiez que ce code n'existe pas déjà dans la base de données.\n\n` +
          `Erreur : ${error.message}`,
        )
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
