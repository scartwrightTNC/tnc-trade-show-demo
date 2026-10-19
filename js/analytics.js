// Analytics Module - Vercel Analytics + Custom Event Tracking

class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.events = [];
        this.isOnline = navigator.onLine;
        
        // Track session start
        this.track('session_start', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            touchEnabled: 'ontouchstart' in window
        });
        
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.track('connection_restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.track('connection_lost');
        });
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Track custom events
    track(eventName, data = {}) {
        const event = {
            event: eventName,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            ...data
        };
        
        this.events.push(event);
        
        // Send to Vercel Analytics if available
        if (window.va) {
            window.va('event', eventName, data);
        }
        
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('[Analytics]', event);
        }
        
        // Store locally for potential export
        this.storeEvent(event);
    }
    
    // Track page/category views
    trackView(viewName, data = {}) {
        this.track('view', {
            view: viewName,
            ...data
        });
    }
    
    // Track demo launches
    trackDemoLaunch(itemId, method, data = {}) {
        this.track('demo_launch', {
            itemId: itemId,
            method: method.type,
            platform: method.platform,
            requiresInternet: method.requiresInternet,
            isOnline: this.isOnline,
            ...data
        });
    }
    
    // Track attraction screen interactions
    trackAttraction(action, data = {}) {
        this.track('attraction_screen', {
            action: action,
            ...data
        });
    }
    
    // Track errors
    trackError(error, context = {}) {
        this.track('error', {
            message: error.message || error,
            stack: error.stack,
            context: context
        });
    }
    
    // Store event locally
    storeEvent(event) {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            stored.push(event);
            
            // Keep only last 1000 events
            if (stored.length > 1000) {
                stored.shift();
            }
            
            localStorage.setItem('analytics_events', JSON.stringify(stored));
        } catch (e) {
            console.error('Failed to store analytics event:', e);
        }
    }
    
    // Export events as CSV
    exportEvents() {
        const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        
        if (stored.length === 0) {
            alert('No analytics data to export');
            return;
        }
        
        const headers = ['Timestamp', 'Event', 'Session ID', 'URL', 'Data'];
        const rows = stored.map(e => [
            e.timestamp,
            e.event,
            e.sessionId,
            e.url,
            JSON.stringify(e)
        ]);
        
        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trade-show-analytics-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Get session duration
    getSessionDuration() {
        return Math.floor((Date.now() - this.sessionStart) / 1000);
    }
    
    // Track session end
    trackSessionEnd() {
        this.track('session_end', {
            duration: this.getSessionDuration(),
            eventCount: this.events.length
        });
    }
}

// Initialize analytics
const analytics = new Analytics();

// Track session end on page unload
window.addEventListener('beforeunload', () => {
    analytics.trackSessionEnd();
});

// Export for use in other modules
window.analytics = analytics;
