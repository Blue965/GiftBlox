# GiftBlox Web Interface

Interface web moderne pour le bot Discord GiftBlox avec système de connexion Discord OAuth2.

## Fonctionnalités

- 🎨 Design moderne et responsive avec Tailwind CSS
- 🔐 Connexion Discord OAuth2 sécurisée
- 📊 Tableau de bord utilisateur avec statistiques
- 📋 Système de tâches interactif
- 🎯 Animations fluides et interface intuitive
- 📱 Compatible mobile et desktop

## Installation

### 1. Configuration Discord OAuth2

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application ou utilisez une existante
3. Allez dans l'onglet "OAuth2" > "General"
4. Ajoutez un redirect URI : `http://localhost:3000/callback.html` (ou votre domaine)
5. Cochez les scopes : `identify`, `guilds.join`, `guilds`
6. Copiez votre `Client ID`

### 2. Configuration du fichier

Ouvrez `script.js` et remplacez `YOUR_DISCORD_CLIENT_ID` par votre Client ID Discord :

```javascript
const DISCORD_CLIENT_ID = 'VOTRE_CLIENT_ID_ICI';
```

### 3. Backend (Optionnel)

Pour une authentification complète, vous aurez besoin d'un backend pour :

- Échanger le code d'autorisation contre un token
- Stocker les tokens de manière sécurisée
- Fournir une API pour les statistiques

Exemple avec Node.js et Express :

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/api/auth/discord', async (req, res) => {
    const { code } = req.body;
    
    try {
        // Échanger le code contre un token
        const response = await axios.post('https://discord.com/api/oauth2/token', {
            client_id: 'YOUR_CLIENT_ID',
            client_secret: 'YOUR_CLIENT_SECRET',
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'YOUR_REDIRECT_URI'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = response.data;
        
        // Récupérer les informations utilisateur
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        res.json({
            token: access_token,
            user: userResponse.data
        });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

app.listen(3000);
```

### 4. Déploiement

#### Option 1: Déploiement local

1. Installez un serveur HTTP (ex: `npm install -g http-server`)
2. Lancez le serveur : `http-server -p 3000`
3. Accédez à `http://localhost:3000`

#### Option 2: Déploiement sur Vercel/Netlify

1. Poussez le dossier `website` sur GitHub
2. Connectez votre repo à Vercel ou Netlify
3. Déployez automatiquement

#### Option 3: Intégration avec le bot Node.js

Vous pouvez intégrer cette interface web directement dans votre bot Node.js en ajoutant Express :

```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.WEB_PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'website')));

// API endpoints
app.get('/api/stats', (req, res) => {
    // Retourner les statistiques du bot
    res.json({
        servers: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        tasks: 25,
        points: 100000
    });
});

app.listen(PORT, () => {
    console.log(`Serveur web démarré sur le port ${PORT}`);
});
```

## Structure des fichiers

```
website/
├── index.html          # Page d'accueil
├── callback.html       # Page de callback OAuth2
├── dashboard.html      # Tableau de bord utilisateur
├── script.js          # JavaScript principal
└── README.md          # Ce fichier
```

## Personnalisation

### Modifier les couleurs

Les couleurs principales sont définies dans les fichiers HTML avec des classes Tailwind CSS. Vous pouvez modifier :

- `gradient-bg` : Le dégradé principal (violet → rose)
- `discord-btn` : Le style des boutons Discord
- `card-gradient` : Le style des cartes

### Ajouter des fonctionnalités

1. **API Backend** : Connectez l'interface à votre base de données SQLite
2. **WebSocket** : Ajoutez des mises à jour en temps réel
3. **Notifications** : Intégrez les notifications Discord
4. **Paiements** : Ajoutez une interface de paiement

## Sécurité

- ⚠️ Ne stockez JAMAIS votre `Client Secret` dans les fichiers frontend
- ⚠️ Utilisez toujours HTTPS en production
- ⚠ Validez toujours les tokens côté serveur
- ⚠️ Implémentez la protection CSRF

## Support

Pour toute question ou problème, contactez l'équipe de développement.

## Licence

Ce projet est propriétaire. Tous droits réservés.
