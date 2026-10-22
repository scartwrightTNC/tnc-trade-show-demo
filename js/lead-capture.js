// Lead Capture Module - Collects attendee email/phone and posts to Salesforce
//
// Posts to the Incoming SMS Force.com Site guest endpoint. The site cannot
// answer a CORS preflight (Apex REST has no OPTIONS handler), so the request
// goes out with Content-Type: text/plain — a CORS "simple request".
// Submissions made while offline queue in localStorage and flush on reconnect.

class LeadCapture {
    constructor() {
        this.endpoint = 'https://noa--fullcopy.sandbox.my.salesforce-sites.com/IncomingSMS/services/apexrest/tradeshow/lead';
        this.source = 'tnc-trade-show-demo';
        this.queueKey = 'tnc-lead-queue';
        this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        this.fab = document.getElementById('leadFab');
        this.modal = document.getElementById('leadModal');
        this.form = document.getElementById('leadForm');
        this.contactInput = document.getElementById('leadContact');
        this.productSelect = document.getElementById('leadProduct');
        this.honeypot = document.getElementById('leadWebsite');
        this.status = document.getElementById('leadStatus');
        this.submitBtn = document.getElementById('leadSubmit');

        this.init();
    }

    init() {
        if (!this.fab || !this.modal) return;

        this.fab.addEventListener('click', () => this.open());

        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());
        document.getElementById('leadModalClose').addEventListener('click', () => this.close());

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit();
        });

        // Flush queued leads when connectivity returns (and once on load)
        window.addEventListener('online', () => this.flushQueue());
        this.flushQueue();
    }

    // item is optional — a demos.json item used to preselect the product
    open(item) {
        this.populateProducts(item ? item.id : null);
        this.setStatus('', '');
        this.form.reset();
        this.modal.classList.add('show');
        this.contactInput.focus();
    }

    close() {
        this.modal.classList.remove('show');
    }

    populateProducts(selectedId) {
        const products = [];
        if (window.menuSystem && window.menuSystem.demoData) {
            window.menuSystem.demoData.categories.forEach(category => {
                category.items.forEach(item => {
                    products.push({ id: item.id, title: item.title });
                });
            });
        }

        if (products.length === 0) {
            this.productSelect.innerHTML = '<option value="">General inquiry</option>';
            return;
        }

        this.productSelect.innerHTML = products.map(p =>
            `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.title}</option>`
        ).join('');

        // Default to the product being viewed; first product otherwise
        if (!selectedId && products.length > 0) {
            this.productSelect.value = products[0].id;
        }
    }

    detectChannel(contact) {
        if (this.emailPattern.test(contact)) return 'Email';
        return contact.replace(/[^0-9]/g, '').length >= 7 ? 'SMS' : null;
    }

    validate(contact) {
        if (!contact) return 'Please enter your email address or mobile number.';
        if (!this.detectChannel(contact)) {
            return 'That doesn\'t look like an email address or phone number.';
        }
        return null;
    }

    async submit() {
        const contact = this.contactInput.value.trim();
        const productId = this.productSelect.value;
        const productTitle = this.productSelect.options[this.productSelect.selectedIndex]?.text || '';

        const error = this.validate(contact);
        if (error) {
            this.setStatus(error, 'error');
            return;
        }

        const payload = {
            contact: contact,
            productId: productId,
            productTitle: productTitle,
            source: this.source,
            website: this.honeypot.value // honeypot — bots fill it, humans don't see it
        };

        this.setBusy(true);

        if (!navigator.onLine) {
            this.enqueue(payload);
            this.setBusy(false);
            this.setStatus('You\'re offline — we\'ll send the info as soon as the kiosk reconnects.', 'ok');
            setTimeout(() => this.close(), 2500);
            return;
        }

        const result = await this.post(payload);
        this.setBusy(false);

        if (result.ok) {
            this.setStatus('Done! Check your ' +
                (result.channel === 'SMS' ? 'messages' : 'inbox') +
                ' for the info link.', 'ok');
            if (window.analytics) {
                window.analytics.track('lead_captured', {
                    productId: productId,
                    channel: result.channel || this.detectChannel(contact)
                });
            }
            setTimeout(() => this.close(), 3000);
        } else {
            this.setStatus(result.error || 'Something went wrong — please try again.', 'error');
        }
    }

    async post(payload) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { ok: false, error: data.error || 'Request failed (' + response.status + ')' };
            }
            return { ok: true, channel: data.channel, sent: data.sent, queued: false };
        } catch (e) {
            return { ok: false, error: 'Network error — please try again.' };
        }
    }

    enqueue(payload) {
        try {
            const queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
            queue.push({ payload: payload, queuedAt: Date.now() });
            localStorage.setItem(this.queueKey, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to queue lead:', e);
        }
    }

    async flushQueue() {
        if (!navigator.onLine) return;

        let queue;
        try {
            queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
        } catch (e) {
            queue = [];
        }
        if (queue.length === 0) return;

        const remaining = [];
        for (const entry of queue) {
            const result = await this.post(entry.payload);
            if (!result.ok) remaining.push(entry);
        }

        try {
            localStorage.setItem(this.queueKey, JSON.stringify(remaining));
        } catch (e) {
            console.error('Failed to update lead queue:', e);
        }
    }

    setBusy(busy) {
        this.submitBtn.disabled = busy;
        this.submitBtn.innerHTML = busy
            ? '<i class="fas fa-spinner fa-spin"></i> Sending...'
            : '<i class="fas fa-paper-plane"></i> Send Info';
    }

    setStatus(message, type) {
        this.status.textContent = message;
        this.status.className = 'lead-status' + (type ? ' ' + type : '');
    }
}

// Initialize lead capture
const leadCapture = new LeadCapture();

// Export for use in other modules
window.leadCapture = leadCapture;
