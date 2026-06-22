const express = require('express');
const cors = require('cors');
const path = require('path');
const { getOrCreateUser, getActiveTasks, getQuery, allQuery } = require('./database/database.js');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du site web
app.use(express.static(path.join(__dirname, 'website')));

// API endpoint pour récupérer les données utilisateur
app.get('/api/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Récupérer les données utilisateur depuis la base de données
        const user = await getOrCreateUser(userId);
        
        // Récupérer le nombre de tâches complétées
        const completedTasks = await getQuery(
            'SELECT COUNT(*) as count FROM user_tasks WHERE discord_id = ? AND status = "approved"',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.json({
            success: true,
            data: {
                userId: user.discord_id,
                username: user.username,
                points: user.points || 0,
                level: user.level || 1,
                xp: user.xp || 0,
                tasksCompleted: completedTasks?.count || 0
            }
        });
    } catch (error) {
        console.error('Erreur API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API endpoint pour récupérer les tâches disponibles
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await getActiveTasks();
        
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Erreur API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API endpoint pour récupérer les cadeaux disponibles
app.get('/api/gifts', async (req, res) => {
    try {
        const gifts = await allQuery('SELECT * FROM giftcodes WHERE status = "available" ORDER BY gift_type, gift_value');
        
        res.json({
            success: true,
            data: gifts
        });
    } catch (error) {
        console.error('Erreur API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur API démarré sur le port ${PORT}`);
    console.log(`🌐 Site web disponible sur http://localhost:${PORT}`);
});

export default app;
