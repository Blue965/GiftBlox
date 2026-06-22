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

// Collection pour stocker les commandes (events ne sont pas stockés pour économiser la mémoire)
client.commands = new Collection();

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

  // Libérer la mémoire après le chargement des commandes
  commandFiles.length = 0;
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

  // Libérer la mémoire après le chargement des événements
  eventFiles.length = 0;
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

// Démarrer le serveur API pour le site web
import('./api.js').then(() => {
    console.log('🌐 Serveur web API démarré');
}).catch(err => {
    console.error('Erreur lors du démarrage du serveur API:', err);
});
