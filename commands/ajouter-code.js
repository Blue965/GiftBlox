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
    .addIntegerOption(option =>
      option
        .setName('valeur_robux')
        .setDescription('La valeur en Robux du code')
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
    const robuxValue = interaction.options.getInteger('valeur_robux');

    // Ajouter le code à la base de données
    try {
      const addedCode = await addGiftCode(code, robuxValue);

      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Code ajouté avec succès')
        .setDescription(
          `Le code cadeau a été ajouté à la boutique.\n\n` +
          `🔐 Code : ||${addedCode.code}||\n` +
          `📊 Valeur : **${robuxValue} Robux**\n` +
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
