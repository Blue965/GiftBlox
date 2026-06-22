// Configuration Discord OAuth2
const DISCORD_CLIENT_ID = '1513281082626281472'; // Remplacez par votre Client ID Discord
const REDIRECT_URI = window.location.origin + '/callback.html';
const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20guilds.join%20guilds`;

// Animation des statistiques
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialisation des statistiques
function initStats() {
    // Les statistiques ont été retirées pour éviter les fausses informations
    // Vous pouvez ajouter des statistiques réelles en connectant à votre API
}

// Login avec Discord
function loginWithDiscord() {
    // Vérifier si le Client ID est configuré
    if (DISCORD_CLIENT_ID === 'YOUR_DISCORD_CLIENT_ID') {
        alert('Veuillez configurer votre Discord Client ID dans le fichier script.js');
        return;
    }
    
    // Rediriger vers Discord OAuth2
    window.location.href = DISCORD_AUTH_URL;
}

// Modal de login
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
}

// Menu mobile
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('hidden');
}

// Smooth scroll pour les liens de navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        // Fermer le menu mobile si ouvert
        document.getElementById('mobileMenu').classList.add('hidden');
    });
});

// Vérifier si l'utilisateur est déjà connecté
function checkAuthStatus() {
    const token = localStorage.getItem('discord_token');
    if (token) {
        // L'utilisateur est connecté
        updateUIForLoggedInUser();
    }
}

// Mettre à jour l'interface pour un utilisateur connecté
function updateUIForLoggedInUser() {
    // Remplacer le bouton de connexion par un bouton de profil
    const loginButtons = document.querySelectorAll('.discord-btn');
    loginButtons.forEach(btn => {
        if (btn.textContent.includes('Connexion') || btn.textContent.includes('Ajouter')) {
            btn.innerHTML = '<i class="fas fa-user mr-2"></i>Tableau de bord';
            btn.onclick = () => window.location.href = '/dashboard.html';
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initStats();
    checkAuthStatus();
    
    // Animation au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
});

// Gestion des erreurs
window.addEventListener('error', (e) => {
    console.error('Erreur:', e);
});

// API pour récupérer les statistiques du bot (à implémenter avec votre backend)
async function fetchBotStats() {
    try {
        // Remplacez cette URL par votre endpoint API
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Mettre à jour les statistiques avec les données réelles
        if (data) {
            document.getElementById('serverCount').textContent = data.servers;
            document.getElementById('userCount').textContent = data.users;
            document.getElementById('taskCount').textContent = data.tasks;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        // Utiliser les statistiques fictives en cas d'erreur
        initStats();
    }
}

// Appeler l'API au chargement (optionnel)
// fetchBotStats();
