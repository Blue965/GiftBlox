import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Création du client Discord avec les intents requis
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Collections pour stocker les commandes et événements
client.commands = new Collection();
client.events = new Collection();

/**
 * Charge toutes les commandes Slash depuis le dossier /commands
 */
async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const fileURL = pathToFileURL(filePath).href;
    const command = await import(fileURL);
    
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      console.log(`✅ Commande chargée : ${command.default.data.name}`);
    } else {
      console.log(`⚠️ La commande ${file} manque les propriétés "data" ou "execute"`);
    }
  }
}

/**
 * Charge tous les événements depuis le dossier /events
 */
async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const fileURL = pathToFileURL(filePath).href;
    const event = await import(fileURL);
    
    if (event.default.name && event.default.execute) {
      if (event.default.name === 'ready') {
        client.once(event.default.name, (...args) => event.default.execute(...args));
      } else {
        client.on(event.default.name, (...args) => event.default.execute(...args));
      }
      console.log(`✅ Événement chargé : ${event.default.name}`);
    } else {
      console.log(`⚠️ L'événement ${file} manque les propriétés "name" ou "execute"`);
    }
  }
}

/**
 * Enregistre les commandes Slash auprès de Discord
 */
async function registerCommands() {
  const commands = [];
  
  for (const command of client.commands.values()) {
    commands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 Début de l\'enregistrement des commandes Slash...');

    // Enregistre les commandes globalement
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID || client.application.id),
      { body: commands },
    );

    console.log('✅ Commandes Slash enregistrées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes :', error);
  }
}

/**
 * Gestionnaire d'interaction pour les commandes Slash
 */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ Commande ${interaction.commandName} non trouvée`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
    
    const errorEmbed = {
      color: 0xff0000,
      title: '❌ Erreur',
      description: 'Une erreur est survenue lors de l\'exécution de cette commande.',
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
});

/**
 * Événement ready : le bot est connecté et prêt
 */
client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  console.log(`📊 Servi dans ${client.guilds.cache.size} serveurs`);
  
  // Enregistrer les commandes Slash
  await registerCommands();
  
  console.log('🎉 Le bot est prêt !');
});

// Chargement des commandes et événements
await loadCommands();
await loadEvents();

// Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
