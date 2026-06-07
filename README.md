# GiftBlox - Bot Discord de Fidélité

Bot Discord moderne et sécurisé permettant aux utilisateurs de cumuler des points via leur activité textuelle et de les échanger contre des codes cadeaux Roblox pré-remplis par l'administrateur.

## ⚠️ Sécurité et Conformité

Ce bot **N'UTILISE AUCUNE API Roblox** officielle ou non officielle, ni aucun cookie (.ROBLOSECURITY). Les codes cadeaux sont gérés manuellement par l'administrateur et stockés dans une base de données locale SQLite.

## 📋 Fonctionnalités

### Système d'XP et de Points
- **Gain automatique** : Chaque message attribue 1 point et 15-25 XP
- **Cooldown anti-spam** : 60 secondes par utilisateur
- **Système de niveaux** : XP nécessaire = niveau × 120
- **Notifications de level-up** : Messages stylés lors des montées de niveau

### Commandes Slash

#### `/profil` (Publique)
Affiche votre profil personnel avec :
- Niveau actuel
- Barre de progression d'XP
- Solde de points

#### `/boutique` (Publique)
Affiche la liste des récompenses disponibles avec :
- Valeur en Robux de chaque carte
- Coût en points
- Stock disponible en temps réel

#### `/acheter-carte [valeur_robux]` (Publique)
Achète une carte cadeau avec vos points :
- Taux de conversion : 1 Robux = 10 points
- Transaction ACID sécurisée
- Envoi du code par message privé (DM)
- Gestion d'erreur si les DMs sont désactivés

#### `/regles` (Publique)
Affiche les règles et avertissements importants :
- Explication du fonctionnement du système
- Avertissement sur la validité des codes
- Informations de sécurité et protection

#### `/ajouter-code [code] [valeur_robux]` (Owner uniquement)
Ajoute un nouveau code cadeau à la boutique :
- Réservé au propriétaire du bot
- Statut automatique : 'available'
- Confirmation invisible aux autres membres

## 🏗️ Architecture du Projet

```
GiftBlox/
├── commands/           # Commandes Slash
│   ├── profil.js
│   ├── boutique.js
│   ├── acheter-carte.js
│   ├── regles.js
│   └── ajouter-code.js
├── events/            # Gestionnaires d'événements
│   └── messageCreate.js
├── database/          # Module de base de données
│   └── database.js
├── package.json
├── .env.example
├── .env               # À créer (non inclus dans git)
├── index.js           # Point d'entrée principal
└── README.md
```

## 🗄️ Base de Données

Le bot utilise **better-sqlite3** avec deux tables :

### Table `users`
- `discord_id` (TEXT, PRIMARY KEY) : ID Discord de l'utilisateur
- `points` (INTEGER, DEFAULT 0) : Solde de points
- `xp` (INTEGER, DEFAULT 0) : XP accumulée
- `level` (INTEGER, DEFAULT 1) : Niveau actuel

### Table `giftcodes`
- `id` (INTEGER, PRIMARY KEY AUTOINCREMENT) : ID unique du code
- `code` (TEXT, UNIQUE) : Le code cadeau
- `robux_value` (INTEGER) : Valeur en Robux
- `status` (TEXT, DEFAULT 'available') : Statut ('available' ou 'used')

## 🚀 Installation

### Prérequis
- Node.js 18.x ou supérieur
- npm ou yarn

### Étapes d'installation

1. **Cloner ou télécharger le projet**
   ```bash
   cd GiftBlox
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Créer le fichier `.env`**
   ```bash
   cp .env.example .env
   ```

4. **Configurer les variables d'environnement**
   Ouvrez le fichier `.env` et remplacez les valeurs :
   ```
   DISCORD_TOKEN=votre_token_discord_ici
   OWNER_ID=votre_id_discord_ici
   ```

   **Pour obtenir votre Discord Token :**
   - Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créez une application
   - Allez dans "Bot" → "Reset Token" pour générer un token
   - Copiez le token

   **Pour obtenir votre Owner ID :**
   - Activez le mode développeur dans Discord
   - Clic droit sur votre profil → "Copier l'ID"

5. **Inviter le bot sur votre serveur**
   - Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Sélectionnez votre application
   - Allez dans "OAuth2" → "URL Generator"
   - Cochez les scopes : `bot` et `applications.commands`
   - Cochez les permissions : `Send Messages`, `Read Messages/View Channels`, `Read Message History`
   - Copiez l'URL générée et ouvrez-la dans votre navigateur

6. **Démarrer le bot**
   ```bash
   npm start
   ```

## 🎮 Utilisation

### Pour les utilisateurs

1. **Gagner des points** : Envoyez des messages dans le serveur
   - 1 point par message
   - 15-25 XP par message
   - Cooldown de 60 secondes

2. **Voir votre profil** : Utilisez `/profil`

3. **Voir la boutique** : Utilisez `/boutique`

4. **Consulter les règles** : Utilisez `/regles` pour voir les avertissements importants

5. **Acheter une carte** : Utilisez `/acheter-carte [valeur]`
   - Assurez-vous d'avoir assez de points
   - Activez vos messages privés pour recevoir le code

### Pour l'administrateur

1. **Ajouter des codes** : Utilisez `/ajouter-code [code] [valeur]`
   - Seul le propriétaire peut utiliser cette commande
   - Les codes sont automatiquement marqués comme disponibles

## 🔒 Sécurité

- **Pas d'API Roblox** : Aucune connexion aux serveurs Roblox
- **Base de données locale** : SQLite stocké localement
- **Transactions ACID** : Intégrité des données garantie
- **Vérification Owner** : Commandes sensibles protégées
- **Gestion des DMs** : Protection contre les erreurs de messagerie privée

## 📝 Configuration Avancée

### Modifier le taux de conversion
Dans `commands/acheter-carte.js` et `commands/boutique.js` :
```javascript
const POINTS_PER_ROBUX = 10; // Changez cette valeur
```

### Modifier les gains d'XP
Dans `events/messageCreate.js` :
```javascript
const xpGained = Math.floor(Math.random() * 11) + 15; // 15 à 25
```

### Modifier le cooldown
Dans `events/messageCreate.js` :
```javascript
const expirationTime = cooldowns.get(userId) + 60000; // 60 secondes en millisecondes
```

### Modifier la formule de niveau
Dans `events/messageCreate.js` :
```javascript
const xpNeededForNextLevel = user.level * 120; // Changez le multiplicateur
```

## 🛠️ Dépannage

### Le bot ne démarre pas
- Vérifiez que le token dans `.env` est correct
- Assurez-vous que Node.js est installé (version 18+)
- Vérifiez que toutes les dépendances sont installées

### Les commandes Slash n'apparaissent pas
- Attendez quelques minutes après le démarrage du bot
- Vérifiez que le bot a les permissions nécessaires
- Réessayez après avoir redémarré le bot

### Erreur lors de l'achat
- Vérifiez que vous avez assez de points
- Assurez-vous que les DMs sont activés
- Vérifiez que le stock n'est pas vide

## 📄 Licence

ISC

## 🤝 Contribution

Ce projet est fourni tel quel. N'hésitez pas à l'adapter selon vos besoins.

## ⚠️ Note Importante

Ce bot est fourni à des fins éducatives. L'utilisation de codes cadeaux Roblox doit respecter les conditions d'utilisation de Roblox. L'auteur n'est pas responsable de l'utilisation abusive de ce logiciel.
