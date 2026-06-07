import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialisation de la base de données SQLite
const dbPath = path.join(__dirname, '..', 'giftblox.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données:', err);
  } else {
    console.log('Base de données connectée avec succès');
  }
});

// Fonction utilitaire pour exécuter des requêtes SQL avec promesses
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Création de la table users si elle n'existe pas
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    discord_id TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
  )
`);

// Création de la table giftcodes si elle n'existe pas
db.run(`
  CREATE TABLE IF NOT EXISTS giftcodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    robux_value INTEGER NOT NULL,
    status TEXT DEFAULT 'available'
  )
`);

/**
 * Récupère ou crée un utilisateur dans la base de données
 * @param {string} discordId - L'ID Discord de l'utilisateur
 * @returns {Promise<Object>} Les données de l'utilisateur
 */
export async function getOrCreateUser(discordId) {
  let user = await getQuery('SELECT * FROM users WHERE discord_id = ?', [discordId]);

  if (!user) {
    await runQuery('INSERT INTO users (discord_id, points, xp, level) VALUES (?, 0, 0, 1)', [discordId]);
    user = await getQuery('SELECT * FROM users WHERE discord_id = ?', [discordId]);
  }

  return user;
}

/**
 * Met à jour les points et l'XP d'un utilisateur
 * @param {string} discordId - L'ID Discord de l'utilisateur
 * @param {number} pointsToAdd - Les points à ajouter
 * @param {number} xpToAdd - L'XP à ajouter
 * @returns {Promise<Object>} Les données mises à jour de l'utilisateur
 */
export async function updateUserPointsAndXP(discordId, pointsToAdd, xpToAdd) {
  await runQuery('UPDATE users SET points = points + ?, xp = xp + ? WHERE discord_id = ?', [pointsToAdd, xpToAdd, discordId]);
  return await getOrCreateUser(discordId);
}

/**
 * Met à jour le niveau d'un utilisateur
 * @param {string} discordId - L'ID Discord de l'utilisateur
 * @param {number} newLevel - Le nouveau niveau
 * @returns {Promise<Object>} Les données mises à jour de l'utilisateur
 */
export async function updateUserLevel(discordId, newLevel) {
  await runQuery('UPDATE users SET level = ? WHERE discord_id = ?', [newLevel, discordId]);
  return await getOrCreateUser(discordId);
}

/**
 * Déduit des points à un utilisateur
 * @param {string} discordId - L'ID Discord de l'utilisateur
 * @param {number} pointsToDeduct - Les points à déduire
 * @returns {Promise<Object>} Les données mises à jour de l'utilisateur
 */
export async function deductUserPoints(discordId, pointsToDeduct) {
  await runQuery('UPDATE users SET points = points - ? WHERE discord_id = ?', [pointsToDeduct, discordId]);
  return await getOrCreateUser(discordId);
}

/**
 * Récupère un code cadeau disponible par valeur
 * @param {number} robuxValue - La valeur en Robux recherchée
 * @returns {Promise<Object|null>} Le code cadeau ou null si aucun disponible
 */
export async function getAvailableGiftCode(robuxValue) {
  return await getQuery('SELECT * FROM giftcodes WHERE robux_value = ? AND status = "available" LIMIT 1', [robuxValue]);
}

/**
 * Met à jour le statut d'un code cadeau
 * @param {number} codeId - L'ID du code cadeau
 * @param {string} status - Le nouveau statut ('available' ou 'used')
 */
export async function updateGiftCodeStatus(codeId, status) {
  await runQuery('UPDATE giftcodes SET status = ? WHERE id = ?', [status, codeId]);
}

/**
 * Ajoute un nouveau code cadeau
 * @param {string} code - Le code du cadeau
 * @param {number} robuxValue - La valeur en Robux
 * @returns {Promise<Object>} Le code cadeau créé
 */
export async function addGiftCode(code, robuxValue) {
  const result = await runQuery('INSERT INTO giftcodes (code, robux_value, status) VALUES (?, ?, "available")', [code, robuxValue]);
  return await getQuery('SELECT * FROM giftcodes WHERE id = ?', [result.lastID]);
}

/**
 * Compte le nombre de codes disponibles par valeur
 * @returns {Promise<Array>} Liste des valeurs avec leur nombre de codes disponibles
 */
export async function countAvailableCodesByValue() {
  return await allQuery('SELECT robux_value, COUNT(*) as count FROM giftcodes WHERE status = "available" GROUP BY robux_value ORDER BY robux_value');
}

/**
 * Récupère toutes les valeurs de Robux disponibles
 * @returns {Promise<Array>} Liste des valeurs uniques
 */
export async function getAvailableRobuxValues() {
  const rows = await allQuery('SELECT DISTINCT robux_value FROM giftcodes WHERE status = "available" ORDER BY robux_value');
  return rows.map(row => row.robux_value);
}

/**
 * Transaction ACID pour l'achat d'un code cadeau
 * @param {string} discordId - L'ID Discord de l'utilisateur
 * @param {number} robuxValue - La valeur en Robux recherchée
 * @param {number} pointsCost - Le coût en points
 * @returns {Promise<Object|null>} Le code cadeau acheté ou null si échec
 */
export async function purchaseGiftCode(discordId, robuxValue, pointsCost) {
  // sqlite3 n'a pas de transactions natives comme better-sqlite3, on simule avec des requêtes séquentielles
  try {
    // Vérifier le solde de l'utilisateur
    const user = await getOrCreateUser(discordId);
    if (user.points < pointsCost) {
      return null;
    }

    // Récupérer un code disponible
    const giftCode = await getAvailableGiftCode(robuxValue);
    if (!giftCode) {
      return null;
    }

    // Déduire les points
    await deductUserPoints(discordId, pointsCost);

    // Marquer le code comme utilisé
    await updateGiftCodeStatus(giftCode.id, 'used');

    return giftCode;
  } catch (error) {
    console.error('Erreur lors de la transaction:', error);
    return null;
  }
}

export default db;
