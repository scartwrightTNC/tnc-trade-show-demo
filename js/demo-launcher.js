// Demo Launcher Module - Handles demo content display and launching

class DemoLauncher {
    constructor() {
        this.modal = document.getElementById('demoModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');
        
        this.init();
    }
    
    init() {
        // Close modal on close button
        this.modalClose.addEventListener('click', () => this.closeModal());
        
        // Close modal on overlay click
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }
    
    showDemo(item, category) {
        const methodsHtml = item.methods.map((method, index) => {
            const statusClass = method.requiresInternet ? 'online' : 'offline';
            const statusText = method.requiresInternet ? 'Internet Required' : 'Works Offline';
            const statusIcon = method.requiresInternet ? 'wifi' : 'check-circle';
            
            return `
                <div class="method-card" data-method-index="${index}">
                    <div class="method-icon">
                        <i class="fas fa-${method.icon}"></i>
                    </div>
                    <div class="method-info">
                        <div class="method-platform">${method.platform}</div>
                        <div class="method-description">${method.label}</div>
                        <span class="method-badge-status ${statusClass}">
                            <i class="fas fa-${statusIcon}"></i>
                            ${statusText}
                        </span>
                    </div>
                    <div class="method-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');
        
        this.modalBody.innerHTML = `
            <div class="demo-header">
                <div class="demo-icon" style="background: ${category.color}">
                    <i class="fas fa-${item.icon || 'cube'}"></i>
                </div>
                <div class="demo-title-section">
                    <div class="demo-title">${item.title}</div>
                    <div class="demo-category">${category.name}</div>
                </div>
            </div>
            
            ${item.description ? `<div class="demo-description">${item.description}</div>` : ''}
            
            <div class="demo-methods">
                <h3 style="font-size: 2.2vmin; margin-bottom: 2vmin; color: var(--mql-gray-800);">Available Demo Methods:</h3>
                ${methodsHtml}
            </div>
            
            <button id="sendInfoBtn" class="lead-submit" style="width: 100%; margin-top: var(--space-xl);">
                <i class="fas fa-paper-plane"></i> Send me more info
            </button>
        `;
        
        // Wire up lead capture for this product
        const sendInfoBtn = this.modalBody.querySelector('#sendInfoBtn');
        if (sendInfoBtn) {
            sendInfoBtn.addEventListener('click', () => {
                this.closeModal();
                if (window.leadCapture) {
                    window.leadCapture.open(item);
                }
            });
        }
        
        // Add click handlers to method cards
        this.modalBody.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('click', () => {
                const methodIndex = parseInt(card.dataset.methodIndex);
                const method = item.methods[methodIndex];
                this.launchDemo(item, method, category);
            });
        });
        
        this.modal.classList.add('show');
    }
    
    closeModal() {
        this.modal.classList.remove('show');
    }
    
    async launchDemo(item, method, category) {
        // Track demo launch
        if (window.analytics) {
            window.analytics.trackDemoLaunch(item.id, method, {
                category: category.id,
                itemTitle: item.title
            });
        }
        
        // Check if method requires internet and we're offline
        if (method.requiresInternet && !window.offlineManager.isOnline) {
            this.showOfflineWarning(method);
            return;
        }
        
        // Handle different demo types
        switch (method.type) {
            case 'device':
            case 'link':
                this.launchExternalLink(method);
                // Close modal after external link launch
                setTimeout(() => this.closeModal(), 500);
                break;
            case 'video':
                await this.launchVideo(method);
                break;
            case 'slides':
                await this.launchSlides(method);
                break;
            case 'iframe':
                this.launchIframe(method);
                break;
            default:
                this.launchExternalLink(method);
                setTimeout(() => this.closeModal(), 500);
        }
    }
    
    launchExternalLink(method) {
        if (method.url) {
            // Open in new tab
            window.open(method.url, '_blank');
            
            // Show confirmation
            this.showNotification('Opening demo in new tab...');
        }
    }
    
    async launchVideo(method) {
        // Check if video file exists
        const videoExists = await this.checkFileExists(method.src);
        
        if (!videoExists) {
            this.showContentPlaceholder('Video', method);
            return;
        }
        
        // Create video player modal
        const videoHtml = `
            <div class="demo-header">
                <div class="demo-title-section">
                    <div class="demo-title">${method.platform} Demo</div>
                </div>
            </div>
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #000; border-radius: 1vmin;">
                <video 
                    controls 
                    autoplay 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                    src="${method.src}"
                    onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#fff;font-size:2vmin;\\'>Video not available</div>'"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
        
        this.modalBody.innerHTML = videoHtml;
    }
    
    async launchSlides(method) {
        // Check if slides file exists
        const slidesExist = await this.checkFileExists(method.src);
        
        if (!slidesExist) {
            this.showContentPlaceholder('Presentation', method);
            return;
        }
        
        // Show slides presentation
        const slidesHtml = `
            <div class="demo-header">
                <div class="demo-title-section">
                    <div class="demo-title">${method.platform} Presentation</div>
                </div>
            </div>
            <div style="text-align: center; padding: 4vmin;">
                <i class="fas fa-file-powerpoint" style="font-size: 10vmin; color: var(--mql-orange); margin-bottom: 2vmin;"></i>
                <p style="font-size: 2vmin; color: var(--mql-gray-600);">
                    Presentation slides would be displayed here.<br>
                    Content: ${method.src || 'slides.pdf'}
                </p>
            </div>
        `;
        
        this.modalBody.innerHTML = slidesHtml;
    }
    
    async checkFileExists(url) {
        if (!url) return false;
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
    
    showContentPlaceholder(type, method) {
        const placeholderHtml = `
            <div class="demo-header">
                <div class="demo-title-section">
                    <div class="demo-title">${method.platform}</div>
                </div>
            </div>
            <div style="text-align: center; padding: 6vmin 4vmin; background: var(--mql-gray-100); border-radius: 1.5vmin;">
                <i class="fas fa-${type === 'Video' ? 'video' : 'file-powerpoint'}" 
                   style="font-size: 10vmin; color: var(--mql-gray-400); margin-bottom: 2vmin;"></i>
                <h3 style="font-size: 2.5vmin; margin-bottom: 1vmin; color: var(--mql-gray-800);">
                    ${type} Coming Soon
                </h3>
                <p style="font-size: 1.8vmin; color: var(--mql-gray-600);">
                    This ${type.toLowerCase()} content is being prepared.<br>
                    Please check back later or try another demo method.
                </p>
                ${method.note ? `<p style="font-size: 1.6vmin; color: var(--mql-gray-500); margin-top: 2vmin; font-style: italic;">${method.note}</p>` : ''}
            </div>
        `;
        
        this.modalBody.innerHTML = placeholderHtml;
    }
    
    launchIframe(method) {
        // Embed iframe content
        const iframeHtml = `
            <div class="demo-header">
                <div class="demo-title-section">
                    <div class="demo-title">${method.platform}</div>
                </div>
            </div>
            <div style="position: relative; padding-bottom: 75%; height: 0; overflow: hidden;">
                <iframe 
                    src="${method.url}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                    allow="fullscreen"
                ></iframe>
            </div>
        `;
        
        this.modalBody.innerHTML = iframeHtml;
    }
    
    showOfflineWarning(method) {
        const warningHtml = `
            <div style="text-align: center; padding: 4vmin;">
                <i class="fas fa-exclamation-triangle" style="font-size: 8vmin; color: var(--mql-orange); margin-bottom: 2vmin;"></i>
                <h3 style="font-size: 3vmin; margin-bottom: 1vmin; color: var(--mql-gray-800);">
                    Internet Required
                </h3>
                <p style="font-size: 2vmin; color: var(--mql-gray-600); margin-bottom: 3vmin;">
                    This demo requires an internet connection.<br>
                    Please try an offline demo method or check your connection.
                </p>
                <button 
                    onclick="window.demoLauncher.closeModal()" 
                    style="
                        background: var(--mql-blue);
                        color: white;
                        border: none;
                        padding: 1.5vmin 4vmin;
                        border-radius: 999px;
                        font-size: 2vmin;
                        font-weight: 600;
                        cursor: pointer;
                    "
                >
                    Go Back
                </button>
            </div>
        `;
        
        this.modalBody.innerHTML = warningHtml;
    }
    
    showNotification(message) {
        // Simple notification (could be enhanced)
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--mql-green);
            color: white;
            padding: 1vmin 2vmin;
            border-radius: 4px;
            font-size: 1.6vmin;
            font-weight: 600;
            box-shadow: var(--shadow-lg);
            z-index: 2000;
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize demo launcher
const demoLauncher = new DemoLauncher();

// Export for use in other modules
window.demoLauncher = demoLauncher;
