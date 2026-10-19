// Offline Module - Service Worker Registration and Management

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineIndicator = document.getElementById('offlineIndicator');
        
        this.init();
    }
    
    init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
        
        // Monitor online/offline status
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Check initial state
        if (!this.isOnline) {
            this.handleOffline();
        }
    }
    
    handleOnline() {
        this.isOnline = true;
        this.hideOfflineIndicator();
        console.log('Connection restored');
        
        // Sync any pending analytics
        if (window.analytics) {
            window.analytics.track('connection_restored');
        }
    }
    
    handleOffline() {
        this.isOnline = false;
        this.showOfflineIndicator();
        console.log('Connection lost - running in offline mode');
        
        if (window.analytics) {
            window.analytics.track('connection_lost');
        }
    }
    
    showOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.style.display = 'flex';
        }
    }
    
    hideOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.style.display = 'none';
        }
    }
    
    // Check if a URL is available offline
    isAvailableOffline(url) {
        // Check if URL is cached by service worker
        return caches.match(url).then(response => !!response);
    }
    
    // Cache additional resources
    async cacheResources(urls) {
        if ('caches' in window) {
            try {
                const cache = await caches.open('trade-show-demo-v1');
                await cache.addAll(urls);
                console.log('Resources cached:', urls);
            } catch (error) {
                console.error('Failed to cache resources:', error);
            }
        }
    }
}

// Initialize offline manager
const offlineManager = new OfflineManager();

// Export for use in other modules
window.offlineManager = offlineManager;
