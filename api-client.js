// Client API partagé — récupère et met en cache les stats du bot

function getApiBaseUrl() {
    const config = window.GIFTBLOX_CONFIG || {};
    if (config.apiBaseUrl) {
        return config.apiBaseUrl.replace(/\/$/, '');
    }
    // Site servi par api.js (port 3001) → URLs relatives
    if (window.location.port === '3001') {
        return '';
    }
    // Dev local (Vite, Live Server, etc.) → API bot sur 3001
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    // Vercel / production sans config → erreur explicite dans la console
    console.warn(
        'GiftBlox : apiBaseUrl non configuré dans config.js. ' +
        'Renseigne l\'URL de ton API KataBump (Network ou kdns.fr).'
    );
    return '';
}

function getStatsCacheKey(userId) {
    return `giftblox_stats_${userId}`;
}

function getCachedUserStats(userId) {
    try {
        const raw = localStorage.getItem(getStatsCacheKey(userId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setCachedUserStats(userId, data) {
    localStorage.setItem(getStatsCacheKey(userId), JSON.stringify({
        ...data,
        cachedAt: Date.now()
    }));
}

function calculateLevelProgress(level, xp) {
    const xpForCurrentLevel = (level - 1) * 120;
    const xpForNextLevel = level * 120;
    const xpProgress = xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));
    return { xpForNextLevel, progressPercentage, xpProgress, xpNeeded };
}

function applyUserStatsToDOM(data, options = {}) {
    const { updateProfile = false } = options;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('userPoints', data.points ?? 0);
    setText('userLevel', data.level ?? 1);
    setText('userTasks', data.tasksCompleted ?? 0);
    setText('userXP', data.xp ?? 0);

    if (updateProfile) {
        const { progressPercentage, xpForNextLevel } = calculateLevelProgress(data.level ?? 1, data.xp ?? 0);
        setText('profileLevelPercent', `${progressPercentage.toFixed(1)}%`);
        setText('profileXP', `${data.xp ?? 0} / ${xpForNextLevel}`);

        const progressBar = document.getElementById('profileProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
    }
}

async function fetchUserStats(userId, options = {}) {
    const { updateProfile = false, useCache = true } = options;

    if (useCache) {
        const cached = getCachedUserStats(userId);
        if (cached) {
            applyUserStatsToDOM(cached, { updateProfile });
        }
    }

    try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/user/${userId}`);
        const result = await response.json();

        if (result.success && result.data) {
            setCachedUserStats(userId, result.data);
            applyUserStatsToDOM(result.data, { updateProfile });
            return result.data;
        }

        if (!useCache || !getCachedUserStats(userId)) {
            applyUserStatsToDOM({ points: '-', level: '-', tasksCompleted: '-', xp: '-' });
        }
        return null;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        if (!getCachedUserStats(userId)) {
            applyUserStatsToDOM({ points: '-', level: '-', tasksCompleted: '-', xp: '-' });
        }
        return null;
    }
}

async function syncUserOnLogin(userId) {
    try {
        const baseUrl = getApiBaseUrl();
        await fetch(`${baseUrl}/api/user/${userId}`);
    } catch (error) {
        console.warn('Sync utilisateur au login:', error);
    }
}
