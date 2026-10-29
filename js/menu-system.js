// Menu System Module - Navigation and Category Management

class MenuSystem {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.currentView = 'categories';
        this.currentCategory = null;
        this.demoData = null;
        this.dataLoaded = false;
        this.navigationStack = [];
        
        this.init();
    }
    
    async init() {
        // Load demo configuration
        await this.loadDemoData();
        
        // Render initial view
        this.renderCategories();
        
        // Setup attraction button
        const attractBtn = document.getElementById('attractBtn');
        if (attractBtn) {
            attractBtn.addEventListener('click', () => {
                if (window.attractionScreen) {
                    window.attractionScreen.activate();
                }
            });
        }
        
        // Setup breadcrumb navigation
        this.breadcrumb.addEventListener('click', (e) => {
            const item = e.target.closest('.breadcrumb-item');
            if (item) {
                const level = parseInt(item.dataset.level);
                this.navigateToLevel(level);
            }
        });
    }
    
    async loadDemoData() {
        try {
            const response = await fetch('data/demos.json');
            this.demoData = await response.json();
            this.dataLoaded = true;
        } catch (error) {
            console.error('Failed to load demo data:', error);
            // Fallback to empty data
            this.demoData = { categories: [] };
            this.dataLoaded = true; // Still mark as loaded even if empty
        }
    }
    
    renderCategories() {
        this.currentView = 'categories';
        this.currentCategory = null;
        this.navigationStack = [];
        this.updateBreadcrumb();
        
        this.mainContent.innerHTML = '';
        
        this.demoData.categories.forEach(category => {
            const card = this.createCategoryCard(category);
            this.mainContent.appendChild(card);
        });
        
        // Track view
        if (window.analytics) {
            window.analytics.trackView('categories');
        }
    }
    
    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.setProperty('--category-color', category.color);
        
        card.innerHTML = `
            ${category.logo
                ? `<img class="category-logo" src="${category.logo}" alt="${category.name}">`
                : `<div class="category-icon"><i class="fas fa-${category.icon}"></i></div>
                   <div class="category-name">${category.name}</div>`}
            ${category.url
                ? `<div class="category-count">Visit site</div>`
                : `<div class="category-count">${category.items.length} items</div>`}
        `;
        
        card.addEventListener('click', () => {
            if (category.url && window.demoLauncher) {
                window.demoLauncher.openSite(category.url);
            } else if (category.items.length === 1 && window.demoLauncher) {
                window.demoLauncher.showDemo(category.items[0], category);
            } else {
                this.renderCategory(category);
            }
        });
        
        return card;
    }
    
    renderCategory(category) {
        this.currentView = 'items';
        this.currentCategory = category;
        this.navigationStack.push({ type: 'category', data: category });
        this.updateBreadcrumb();
        
        this.mainContent.innerHTML = '';
        
        category.items.forEach(item => {
            const card = this.createItemCard(item, category);
            this.mainContent.appendChild(card);
        });
        
        // Track view
        if (window.analytics) {
            window.analytics.trackView('category', {
                category: category.id,
                itemCount: category.items.length
            });
        }
    }
    
    createItemCard(item, category) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const methodsHtml = item.methods.map(method => `
            <span class="method-badge ${method.requiresInternet ? 'online' : 'offline'}">
                <i class="fas fa-${method.icon}"></i>
                ${method.platform}
            </span>
        `).join('');
        
        card.innerHTML = `
            <div class="item-header">
                ${item.logo
                    ? `<img class="item-logo" src="${item.logo}" alt="${item.title}">`
                    : `<div class="item-icon"><i class="fas fa-${item.icon || 'cube'}"></i></div>
                       <div class="item-title">${item.title}</div>`}
            </div>
            <div class="item-description">${item.description || ''}</div>
            <div class="item-methods">
                ${methodsHtml}
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.openDemoDetail(item, category);
        });
        
        return card;
    }
    
    openDemoDetail(item, category) {
        if (window.demoLauncher) {
            window.demoLauncher.showDemo(item, category);
        }
        
        // Track view
        if (window.analytics) {
            window.analytics.trackView('demo_detail', {
                itemId: item.id,
                category: category.id
            });
        }
    }
    
    updateBreadcrumb() {
        this.breadcrumb.innerHTML = '';
        
        // Home
        const homeItem = document.createElement('button');
        homeItem.className = 'breadcrumb-item';
        homeItem.dataset.level = 0;
        homeItem.innerHTML = '<i class="fas fa-home"></i> Home';
        if (this.currentView === 'categories') {
            homeItem.classList.add('active');
        }
        this.breadcrumb.appendChild(homeItem);
        
        // Category
        if (this.currentCategory) {
            const catItem = document.createElement('button');
            catItem.className = 'breadcrumb-item active';
            catItem.dataset.level = 1;
            catItem.textContent = this.currentCategory.name;
            this.breadcrumb.appendChild(catItem);
        }
    }
    
    navigateToLevel(level) {
        if (level === 0) {
            this.renderCategories();
        }
    }
    
    // Show QR code for current view
    showQRCode() {
        const modal = document.getElementById('qrModal');
        const qrCodeDiv = document.getElementById('qrCode');
        const qrUrl = document.getElementById('qrUrl');
        
        const url = window.location.href;
        qrUrl.textContent = url;
        
        // Generate QR code
        qrCodeDiv.innerHTML = '';
        QRCode.toCanvas(url, { width: 300 }, (error, canvas) => {
            if (!error) {
                qrCodeDiv.appendChild(canvas);
            }
        });
        
        modal.classList.add('show');
        
        // Close button
        document.getElementById('qrClose').addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // Track QR code view
        if (window.analytics) {
            window.analytics.track('qr_code_view', {
                url: url
            });
        }
    }
}

// Initialize menu system
const menuSystem = new MenuSystem();

// Export for use in other modules
window.menuSystem = menuSystem;
