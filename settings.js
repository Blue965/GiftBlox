// GiftBlox Settings - Shared across all pages

// Apply settings to current page
function applySettings() {
    const theme = localStorage.getItem('theme') || 'dark';
    const animations = localStorage.getItem('animations') !== 'false';
    const language = localStorage.getItem('language') || 'fr';

    console.log('Applying settings:', { theme, animations, language });

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

        // Update gradient backgrounds for light theme
        document.querySelectorAll('.gradient-bg').forEach(el => {
            el.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)';
        });

        // Update card backgrounds
        document.querySelectorAll('.card-gradient').forEach(el => {
            el.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)';
            el.style.borderColor = 'rgba(156, 163, 175, 0.3)';
        });

        // Update nav background
        document.querySelectorAll('nav').forEach(el => {
            el.classList.remove('bg-gray-900/90');
            el.classList.add('bg-white/90');
        });

        // Update border colors
        document.querySelectorAll('.border-gray-800').forEach(el => {
            el.classList.remove('border-gray-800');
            el.classList.add('border-gray-300');
        });

        // Update input backgrounds
        document.querySelectorAll('.bg-gray-700').forEach(el => {
            el.classList.remove('bg-gray-700');
            el.classList.add('bg-gray-200');
        });

        // Update input borders
        document.querySelectorAll('.border-gray-600').forEach(el => {
            el.classList.remove('border-gray-600');
            el.classList.add('border-gray-400');
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

        // Revert gradient backgrounds
        document.querySelectorAll('.gradient-bg').forEach(el => {
            el.style.background = '';
        });

        // Revert card backgrounds
        document.querySelectorAll('.card-gradient').forEach(el => {
            el.style.background = '';
            el.style.borderColor = '';
        });

        // Revert nav background
        document.querySelectorAll('nav').forEach(el => {
            el.classList.remove('bg-white/90');
            el.classList.add('bg-gray-900/90');
        });

        // Revert border colors
        document.querySelectorAll('.border-gray-300').forEach(el => {
            el.classList.remove('border-gray-300');
            el.classList.add('border-gray-800');
        });

        // Revert input backgrounds
        document.querySelectorAll('.bg-gray-200').forEach(el => {
            el.classList.remove('bg-gray-200');
            el.classList.add('bg-gray-700');
        });

        // Revert input borders
        document.querySelectorAll('.border-gray-400').forEach(el => {
            el.classList.remove('border-gray-400');
            el.classList.add('border-gray-600');
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

    // Apply language if translations are available
    setTimeout(() => {
        if (typeof applyLanguage === 'function') {
            console.log('Applying language:', language);
            applyLanguage(language);
        } else {
            console.warn('applyLanguage function not available');
        }
    }, 100);
}

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, applying settings');
    applySettings();
});

// Listen for settings changes (for multi-tab sync)
window.addEventListener('storage', (e) => {
    if (e.key === 'theme' || e.key === 'animations' || e.key === 'language') {
        console.log('Storage changed, applying settings');
        applySettings();
    }
});
