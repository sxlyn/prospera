import { useState, useEffect } from 'react';

export const useTheme = () => {
    // Determine the initial theme
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme; // 'light', 'dark', or 'system'
        }
        return 'system';
    };

    const [theme, setTheme] = useState(getInitialTheme);
    const [activeTheme, setActiveTheme] = useState('light'); // Actual resolved theme

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const applyTheme = (selectedTheme) => {
            let resolvedTheme = selectedTheme;
            
            if (selectedTheme === 'system') {
                resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
            }

            document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
            setActiveTheme(resolvedTheme);

            // Update meta theme-color for mobile PWA support
            let metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#212529' : '#1E3A8A');
            }
        };

        // Apply immediately
        applyTheme(theme);

        // Listener for system preference changes (Memory Leak Prevention)
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        // Modern browsers support addEventListener on MediaQueryList
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            mediaQuery.addListener(handleChange); // Fallback for older browsers
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                mediaQuery.removeListener(handleChange); // Fallback
            }
        };
    }, [theme]);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return { theme, activeTheme, changeTheme };
};
