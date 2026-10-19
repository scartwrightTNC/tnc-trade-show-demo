// Attraction Screen Module

class AttractionScreen {
    constructor() {
        this.layer = document.getElementById('attractLayer');
        this.tagline = document.getElementById('attractTagline');
        this.isActive = true;
        this.idleTimeout = 60000; // 60 seconds
        this.idleTimer = null;
        this.taglineIndex = 0;
        this.taglineInterval = null;
        
        this.taglines = [
            'Self Storage Solutions',
            'Enterprise Management Platform',
            'Customer Experience Reimagined',
            'Revenue Optimization Made Simple',
            'Comprehensive Management Services'
        ];
        
        this.init();
    }
    
    init() {
        // Start tagline rotation
        this.startTaglineRotation();
        
        // Touch/click to enter
        this.layer.addEventListener('click', () => this.exit());
        
        // Reset idle timer on any interaction
        ['pointerdown', 'touchstart', 'click', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => this.resetIdleTimer(), true);
        });
        
        // Track attraction screen view
        if (window.analytics) {
            window.analytics.trackAttraction('view', {
                taglines: this.taglines.length
            });
        }
        
        // Start idle timer
        this.resetIdleTimer();
    }
    
    startTaglineRotation() {
        this.taglineInterval = setInterval(() => {
            // Fade out
            this.tagline.classList.add('fade-out');
            
            setTimeout(() => {
                // Change tagline
                this.taglineIndex = (this.taglineIndex + 1) % this.taglines.length;
                this.tagline.textContent = this.taglines[this.taglineIndex];
                
                // Fade in
                this.tagline.classList.remove('fade-out');
            }, 500);
        }, 5000); // Change every 5 seconds
    }
    
    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        
        // Only set timer if not in attract mode
        if (!this.isActive) {
            this.idleTimer = setTimeout(() => {
                this.enter();
            }, this.idleTimeout);
        }
    }
    
    enter() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.layer.classList.remove('hidden');
        
        // Track return to attraction screen
        if (window.analytics) {
            window.analytics.trackAttraction('enter', {
                timeAway: Date.now() - this.exitTime
            });
        }
    }
    
    exit() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.exitTime = Date.now();
        this.layer.classList.add('hidden');
        
        // Show main app
        document.getElementById('app').style.display = 'flex';
        
        // Track exit from attraction screen
        if (window.analytics) {
            window.analytics.trackAttraction('exit', {
                taglineIndex: this.taglineIndex,
                tagline: this.taglines[this.taglineIndex]
            });
        }
        
        // Start idle timer for return to attract mode
        this.resetIdleTimer();
    }
    
    // Manually trigger attraction mode
    activate() {
        this.enter();
    }
    
    // Manually exit attraction mode
    deactivate() {
        this.exit();
    }
}

// Initialize attraction screen
const attractionScreen = new AttractionScreen();

// Export for use in other modules
window.attractionScreen = attractionScreen;
