// Main Application Logic

class TradeShowApp {
    constructor() {
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }
    
    start() {
        console.log('Trade Show Demo initialized');
        
        // Track app initialization
        if (window.analytics) {
            window.analytics.track('app_init', {
                url: window.location.href,
                referrer: document.referrer
            });
        }
        
        // Check for URL parameters
        this.handleUrlParams();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup visibility change handler
        this.setupVisibilityHandler();
        
        // Preload critical resources
        this.preloadResources();
    }
    
    handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        // Check for demo parameter
        const demoId = params.get('demo');
        if (demoId) {
            // Auto-launch specific demo
            // This would require the menu system to be initialized first
            setTimeout(() => {
                this.launchDemoById(demoId);
            }, 1000);
        }
        
        // Check for category parameter
        const categoryId = params.get('category');
        if (categoryId && window.menuSystem) {
            // Auto-navigate to category
            setTimeout(() => {
                this.navigateToCategory(categoryId);
            }, 500);
        }
        
        // Check for attract mode parameter
        if (params.get('attract') === 'false') {
            // Skip attraction screen
            if (window.attractionScreen) {
                window.attractionScreen.exit();
            }
        }
        
        // Check for debug mode
        if (params.get('debug') === '1') {
            this.enableDebugMode();
        }
    }
    
    launchDemoById(demoId) {
        // Find demo item by ID
        if (!window.menuSystem || !window.menuSystem.demoData) return;
        
        for (const category of window.menuSystem.demoData.categories) {
            const item = category.items.find(i => i.id === demoId);
            if (item) {
                window.menuSystem.renderCategory(category);
                setTimeout(() => {
                    window.demoLauncher.showDemo(item, category);
                }, 300);
                break;
            }
        }
    }
    
    navigateToCategory(categoryId) {
        if (!window.menuSystem || !window.menuSystem.demoData) return;
        
        const category = window.menuSystem.demoData.categories.find(c => c.id === categoryId);
        if (category) {
            window.menuSystem.renderCategory(category);
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC - Return to attract mode
            if (e.key === 'Escape' && !window.attractionScreen.isActive) {
                window.attractionScreen.activate();
            }
            
            // H - Go home
            if (e.key === 'h' || e.key === 'H') {
                if (window.menuSystem) {
                    window.menuSystem.renderCategories();
                }
            }
            
            // Q - Show QR code
            if (e.key === 'q' || e.key === 'Q') {
                if (window.menuSystem) {
                    window.menuSystem.showQRCode();
                }
            }
            
            // E - Export analytics
            if (e.key === 'e' || e.key === 'E') {
                if (window.analytics) {
                    window.analytics.exportEvents();
                }
            }
        });
    }
    
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page hidden
                if (window.analytics) {
                    window.analytics.track('page_hidden');
                }
            } else {
                // Page visible
                if (window.analytics) {
                    window.analytics.track('page_visible');
                }
            }
        });
    }
    
    preloadResources() {
        // Preload critical images
        const imagesToPreload = [
            'assets/images/tnc-logo.png',
            'assets/images/favicon.png'
        ];
        
        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    enableDebugMode() {
        // Add debug overlay
        const debug = document.createElement('div');
        debug.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 4px;
            z-index: 9999;
            max-width: 300px;
        `;
        debug.innerHTML = `
            <div><strong>Debug Mode</strong></div>
            <div>Session: ${window.analytics.sessionId}</div>
            <div>Online: ${window.offlineManager.isOnline ? 'Yes' : 'No'}</div>
            <div>View: ${window.menuSystem.currentView}</div>
            <div style="margin-top: 5px; font-size: 10px;">
                Press E to export analytics
            </div>
        `;
        document.body.appendChild(debug);
        
        console.log('Debug mode enabled');
    }
}

// Initialize app
const app = new TradeShowApp();

// Export for use in other modules
window.app = app;
