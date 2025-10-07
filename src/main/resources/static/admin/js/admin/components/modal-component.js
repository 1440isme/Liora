/**
 * Modal Component
 * Handles modal functionality for admin panel
 */

class ModalComponent {
    constructor(options = {}) {
        this.options = {
            title: 'Modal',
            content: '',
            size: 'medium', // small, medium, large, xlarge
            closable: true,
            backdrop: true,
            keyboard: true,
            focus: true,
            ...options
        };

        this.modal = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    /**
     * Create modal HTML structure
     */
    createModal() {
        const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        this.modal = document.createElement('div');
        this.modal.className = 'admin-modal';
        this.modal.id = modalId;
        this.modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-dialog modal-${this.options.size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${this.options.title}</h5>
                        ${this.options.closable ? '<button type="button" class="modal-close">&times;</button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${this.options.content}
                    </div>
                    <div class="modal-footer">
                        <!-- Footer content will be added dynamically -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        if (this.options.backdrop) {
            const backdrop = this.modal.querySelector('.modal-backdrop');
            backdrop.addEventListener('click', () => this.close());
        }

        // Keyboard events
        if (this.options.keyboard) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
    }

    /**
     * Show modal
     */
    show() {
        if (this.isOpen) return;

        this.modal.classList.add('show');
        this.isOpen = true;

        // Focus management
        if (this.options.focus) {
            const focusableElement = this.modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElement) {
                focusableElement.focus();
            }
        }

        // Trigger show event
        this.triggerEvent('show');
    }

    /**
     * Hide modal
     */
    hide() {
        if (!this.isOpen) return;

        this.modal.classList.remove('show');
        this.isOpen = false;

        // Trigger hide event
        this.triggerEvent('hide');
    }

    /**
     * Close modal
     */
    close() {
        this.hide();

        // Remove modal from DOM after animation
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
        }, 300);
    }

    /**
     * Set modal title
     */
    setTitle(title) {
        const titleElement = this.modal.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Set modal content
     */
    setContent(content) {
        const bodyElement = this.modal.querySelector('.modal-body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
        }
    }

    /**
     * Add button to footer
     */
    addButton(text, className = 'btn-admin btn-admin-secondary', onClick = null) {
        const footer = this.modal.querySelector('.modal-footer');
        if (!footer) return;

        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        footer.appendChild(button);
        return button;
    }

    /**
     * Clear footer buttons
     */
    clearButtons() {
        const footer = this.modal.querySelector('.modal-footer');
        if (footer) {
            footer.innerHTML = '';
        }
    }

    /**
     * Set modal size
     */
    setSize(size) {
        const dialog = this.modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.className = `modal-dialog modal-${size}`;
        }
    }

    /**
     * Trigger custom event
     */
    triggerEvent(eventName, detail = {}) {
        const event = new CustomEvent(`modal:${eventName}`, {
            detail: { modal: this, ...detail }
        });
        this.modal.dispatchEvent(event);
    }

    /**
     * Get modal element
     */
    getModal() {
        return this.modal;
    }

    /**
     * Check if modal is open
     */
    isModalOpen() {
        return this.isOpen;
    }
}

/**
 * Confirm Modal
 */
class ConfirmModal extends ModalComponent {
    constructor(message, title = 'Xác nhận', options = {}) {
        super({
            title,
            content: `<p>${message}</p>`,
            size: 'small',
            ...options
        });

        this.setupConfirmButtons();
    }

    setupConfirmButtons() {
        this.clearButtons();

        const cancelBtn = this.addButton('Hủy', 'btn-admin btn-admin-secondary', () => {
            this.triggerEvent('confirm', { confirmed: false });
            this.close();
        });

        const confirmBtn = this.addButton('Xác nhận', 'btn-admin btn-admin-danger', () => {
            this.triggerEvent('confirm', { confirmed: true });
            this.close();
        });

        // Focus on confirm button
        setTimeout(() => confirmBtn.focus(), 100);
    }
}

/**
 * Alert Modal
 */
class AlertModal extends ModalComponent {
    constructor(message, title = 'Thông báo', type = 'info', options = {}) {
        const iconClass = {
            'success': 'fas fa-check-circle text-success',
            'error': 'fas fa-exclamation-circle text-danger',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'info': 'fas fa-info-circle text-info'
        }[type] || 'fas fa-info-circle text-info';

        super({
            title: `<i class="${iconClass}"></i> ${title}`,
            content: `<p>${message}</p>`,
            size: 'small',
            ...options
        });

        this.setupAlertButton();
    }

    setupAlertButton() {
        this.clearButtons();

        const okBtn = this.addButton('OK', 'btn-admin btn-admin-primary', () => {
            this.triggerEvent('alert', { action: 'ok' });
            this.close();
        });

        // Focus on OK button
        setTimeout(() => okBtn.focus(), 100);
    }
}

/**
 * Form Modal
 */
class FormModal extends ModalComponent {
    constructor(title, formHtml, options = {}) {
        super({
            title,
            content: formHtml,
            size: 'large',
            ...options
        });

        this.form = this.modal.querySelector('form');
        this.setupFormButtons();
    }

    setupFormButtons() {
        this.clearButtons();

        const cancelBtn = this.addButton('Hủy', 'btn-admin btn-admin-secondary', () => {
            this.triggerEvent('form', { action: 'cancel' });
            this.close();
        });

        const submitBtn = this.addButton('Lưu', 'btn-admin btn-admin-primary', () => {
            this.submitForm();
        });

        // Handle form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
    }

    submitForm() {
        if (!this.form) return;

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        this.triggerEvent('form', { action: 'submit', data });
    }

    getFormData() {
        if (!this.form) return {};

        const formData = new FormData(this.form);
        return Object.fromEntries(formData.entries());
    }

    setFormData(data) {
        if (!this.form) return;

        Object.keys(data).forEach(key => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = data[key];
                } else {
                    input.value = data[key];
                }
            }
        });
    }
}

/**
 * Loading Modal
 */
class LoadingModal extends ModalComponent {
    constructor(message = 'Đang xử lý...', options = {}) {
        super({
            title: '',
            content: `
                <div class="text-center">
                    <div class="loading-spinner mb-3">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                    <p>${message}</p>
                </div>
            `,
            size: 'small',
            closable: false,
            backdrop: false,
            ...options
        });
    }

    setMessage(message) {
        const messageElement = this.modal.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

/**
 * Modal Manager
 */
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.zIndex = 1050;
    }

    /**
     * Create modal
     */
    create(id, type, options = {}) {
        let modal;

        switch (type) {
            case 'confirm':
                modal = new ConfirmModal(options.message, options.title, options);
                break;
            case 'alert':
                modal = new AlertModal(options.message, options.title, options.type, options);
                break;
            case 'form':
                modal = new FormModal(options.title, options.content, options);
                break;
            case 'loading':
                modal = new LoadingModal(options.message, options);
                break;
            default:
                modal = new ModalComponent(options);
        }

        this.modals.set(id, modal);
        return modal;
    }

    /**
     * Show modal
     */
    show(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.show();
            this.updateZIndex(modal);
        }
    }

    /**
     * Hide modal
     */
    hide(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.hide();
        }
    }

    /**
     * Close modal
     */
    close(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.close();
            this.modals.delete(id);
        }
    }

    /**
     * Get modal
     */
    get(id) {
        return this.modals.get(id);
    }

    /**
     * Update z-index
     */
    updateZIndex(modal) {
        const modalElement = modal.getModal();
        if (modalElement) {
            modalElement.style.zIndex = this.zIndex++;
        }
    }

    /**
     * Close all modals
     */
    closeAll() {
        this.modals.forEach(modal => modal.close());
        this.modals.clear();
    }
}

// Global modal manager instance
window.modalManager = new ModalManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ModalComponent,
        ConfirmModal,
        AlertModal,
        FormModal,
        LoadingModal,
        ModalManager
    };
}
