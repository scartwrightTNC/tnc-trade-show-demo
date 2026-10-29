// Lead Capture Module - Collects attendee email/phone and posts to Salesforce
//
// Posts to the Incoming SMS Force.com Site guest endpoint. The site cannot
// answer a CORS preflight (Apex REST has no OPTIONS handler), so the request
// goes out with Content-Type: text/plain — a CORS "simple request".
// Submissions made while offline queue in localStorage and flush on reconnect.

class LeadCapture {
    constructor() {
        this.endpoint = 'https://noa.my.salesforce-sites.com/IncomingSMS/services/apexrest/tradeshow/lead';
        this.source = 'tnc-trade-show-demo';
        // Which trade show this kiosk is at — set per device via a
        // ?show=<slug> URL param (bookmark it). Null when unset; Salesforce
        // stores whatever slug arrives.
        this.show = new URLSearchParams(window.location.search).get('show');
        this.queueKey = 'tnc-lead-queue';
        this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        this._sending = new Set(); // entry ids currently being posted

        this.fab = document.getElementById('leadFab');
        this.modal = document.getElementById('leadModal');
        this.form = document.getElementById('leadForm');
        this.contactInput = document.getElementById('leadContact');
        this.firstNameInput = document.getElementById('leadFirstName');
        this.lastNameInput = document.getElementById('leadLastName');
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

        // In-page keyboard types into whichever field was last focused.
        this.activeInput = this.firstNameInput;
        this.buildKeyboard();

        // Keep the focused field above the on-screen keyboard. Chrome honors
        // interactive-widget=resizes-content, but iOS overlays the keyboard
        // without resizing — scroll the input into view instead.
        [this.firstNameInput, this.lastNameInput, this.contactInput].forEach(input => {
            input.addEventListener('focus', () => {
                this.activeInput = input;
                setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
            });
        });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const active = document.activeElement;
                if (active && this.form.contains(active)) {
                    active.scrollIntoView({ block: 'center' });
                }
            });
        }

        // Flush queued leads when connectivity returns, once on load, and on a
        // timer — navigator.onLine and the 'online' event are unreliable on
        // kiosk networks, so the interval is the real safety net.
        window.addEventListener('online', () => this.flushQueue());
        window.addEventListener('pageshow', () => this.flushQueue());
        setInterval(() => this.flushQueue(), 60000);
        this.updateBadge();
        this.flushQueue();
    }

    // item is optional — a demos.json item used to preselect the product
    open(item) {
        this.populateProducts(item ? item.id : null);
        this.setStatus('', '');
        this.form.reset();
        this.modal.classList.add('show');
        this.firstNameInput.focus();
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

    buildKeyboard() {
        const kb = document.getElementById('leadKeyboard');
        if (!kb) return;
        const rows = [
            '1234567890'.split(''),
            'qwertyuiop'.split(''),
            'asdfghjkl'.split(''),
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
            ['@', '.', '-', '_', '+', ' ']
        ];
        rows.forEach(keys => {
            const row = document.createElement('div');
            row.className = 'lead-key-row';
            keys.forEach(k => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'lead-key' + (k === '⌫' || k === ' ' ? ' wide' : '');
                btn.textContent = k === ' ' ? 'space' : k;
                // Keep the input's focus/caret while keys are tapped.
                btn.addEventListener('mousedown', e => e.preventDefault());
                btn.addEventListener('click', () => this.typeKey(k));
                row.appendChild(btn);
            });
            kb.appendChild(row);
        });
    }

    typeKey(k) {
        const input = this.activeInput;
        if (!input) return;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? start;
        if (k === '⌫') {
            if (start !== end) {
                input.value = input.value.slice(0, start) + input.value.slice(end);
                input.setSelectionRange(start, start);
            } else if (start > 0) {
                input.value = input.value.slice(0, start - 1) + input.value.slice(end);
                input.setSelectionRange(start - 1, start - 1);
            }
        } else {
            input.value = input.value.slice(0, start) + k + input.value.slice(end);
            input.setSelectionRange(start + 1, start + 1);
        }
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    detectChannel(contact) {
        if (this.emailPattern.test(contact)) return 'Email';
        return contact.replace(/[^0-9]/g, '').length >= 7 ? 'SMS' : null;
    }

    validate(contact, firstName, lastName) {
        if (!firstName || !lastName) return 'Please enter your first and last name.';
        if (!contact) return 'Please enter your email address or mobile number.';
        if (!this.detectChannel(contact)) {
            return 'That doesn\'t look like an email address or phone number.';
        }
        return null;
    }

    async submit() {
        const contact = this.contactInput.value.trim();
        const firstName = this.firstNameInput.value.trim();
        const lastName = this.lastNameInput.value.trim();
        const productId = this.productSelect.value;
        const productTitle = this.productSelect.options[this.productSelect.selectedIndex]?.text || '';

        const error = this.validate(contact, firstName, lastName);
        if (error) {
            this.setStatus(error, 'error');
            return;
        }

        const payload = {
            contact: contact,
            firstName: firstName,
            lastName: lastName,
            productId: productId,
            productTitle: productTitle,
            source: this.source,
            show: this.show,
            website: this.honeypot.value // honeypot — bots fill it, humans don't see it
        };

        this.setBusy(true);

        // Write to the on-disk queue first — if the kiosk loses power or the
        // network mid-send, the lead is never lost.
        const entry = this.enqueue(payload);

        if (!navigator.onLine) {
            this.setBusy(false);
            this.setStatus('You\'re offline — saved, and we\'ll send it as soon as the kiosk reconnects.', 'ok');
            setTimeout(() => this.close(), 2500);
            return;
        }

        this._sending.add(entry.id);
        const result = await this.post(payload);
        this._sending.delete(entry.id);
        this.setBusy(false);

        if (result.ok) {
            this.removeFromQueue(entry.id);
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
        } else if (!result.rejected) {
            // Network-type failure — keep it queued, retry happens on the timer.
            this.setStatus('Can\'t reach the server right now — saved, and we\'ll send it automatically once connected.', 'ok');
            setTimeout(() => this.close(), 3000);
        } else {
            // Server rejected the payload — drop it, retrying won't help.
            this.removeFromQueue(entry.id);
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
                return {
                    ok: false,
                    rejected: true, // server answered — don't retry from queue
                    error: data.error || 'Request failed (' + response.status + ')'
                };
            }
            return { ok: true, channel: data.channel, sent: data.sent };
        } catch (e) {
            return { ok: false, rejected: false, error: 'Network error — please try again.' };
        }
    }

    getQueue() {
        try {
            return JSON.parse(localStorage.getItem(this.queueKey) || '[]');
        } catch (e) {
            return [];
        }
    }

    setQueue(queue) {
        try {
            localStorage.setItem(this.queueKey, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to update lead queue:', e);
        }
        this.updateBadge();
    }

    enqueue(payload) {
        const entry = {
            id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            payload: payload,
            queuedAt: Date.now()
        };
        const queue = this.getQueue();
        queue.push(entry);
        this.setQueue(queue);
        return entry;
    }

    removeFromQueue(id) {
        this.setQueue(this.getQueue().filter(e => e.id !== id));
    }

    async flushQueue() {
        if (this._flushing) return;
        this._flushing = true;

        try {
            const queue = this.getQueue();
            if (queue.length === 0) return;

            // Track which entries are done rather than rewriting the queue —
            // entries enqueued while the flush is in flight must survive.
            const done = new Set();
            for (const entry of queue) {
                if (this._sending.has(entry.id)) continue;
                this._sending.add(entry.id);
                const result = await this.post(entry.payload);
                this._sending.delete(entry.id);
                // Success or a server rejection both end the entry; only
                // network-type failures stay queued for the next retry.
                if (result.ok || result.rejected) {
                    done.add(entry.id);
                }
            }

            this.setQueue(this.getQueue().filter(e => !done.has(e.id)));
        } finally {
            this._flushing = false;
        }
    }

    updateBadge() {
        const count = this.getQueue().length;
        let badge = this.fab.querySelector('.lead-fab-badge');
        if (count > 0 && !badge) {
            badge = document.createElement('span');
            badge.className = 'lead-fab-badge';
            this.fab.appendChild(badge);
        }
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
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
