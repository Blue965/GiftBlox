// GiftBlox Settings - Shared across all pages

// Apply settings to current page
function applySettings() {
    const theme = localStorage.getItem('theme') || 'dark';
    const animations = localStorage.getItem('animations') !== 'false';

    // Apply theme
    if (theme === 'light') {
        document.body.classList.remove('bg-gray-900');
        document.body.classList.add('bg-gray-100');
        
        // Update text colors for light theme
        document.querySelectorAll('.text-white').forEach(el => {
            el.classList.remove('text-white');
            el.classList.add('text-gray-900');
        });
        
        document.querySelectorAll('.text-gray-300').forEach(el => {
            el.classList.remove('text-gray-300');
            el.classList.add('text-gray-700');
        });
        
        document.querySelectorAll('.text-gray-400').forEach(el => {
            el.classList.remove('text-gray-400');
            el.classList.add('text-gray-600');
        });
        
    } else if (theme === 'dark') {
        document.body.classList.remove('bg-gray-100');
        document.body.classList.add('bg-gray-900');
        
        // Revert text colors for dark theme
        document.querySelectorAll('.text-gray-900').forEach(el => {
            el.classList.remove('text-gray-900');
            el.classList.add('text-white');
        });
        
        document.querySelectorAll('.text-gray-700').forEach(el => {
            el.classList.remove('text-gray-700');
            el.classList.add('text-gray-300');
        });
        
        document.querySelectorAll('.text-gray-600').forEach(el => {
            el.classList.remove('text-gray-600');
            el.classList.add('text-gray-400');
        });
    }

    // Apply animations
    if (!animations) {
        document.documentElement.style.setProperty('--animation-duration', '0s');
        document.querySelectorAll('*').forEach(el => {
            el.style.animation = 'none';
            el.style.transition = 'none';
        });
    } else {
        document.documentElement.style.removeProperty('--animation-duration');
        document.querySelectorAll('*').forEach(el => {
            el.style.animation = '';
            el.style.transition = '';
        });
    }
}

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    applySettings();
});

// Listen for settings changes (for multi-tab sync)
window.addEventListener('storage', (e) => {
    if (e.key === 'theme' || e.key === 'animations') {
        applySettings();
    }
});
