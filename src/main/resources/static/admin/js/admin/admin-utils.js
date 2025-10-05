/**
 * Admin Utilities
 * Common utility functions for admin panel
 */

class AdminUtils {
    /**
     * Format currency in Vietnamese format
     */
    static formatCurrency(amount, currency = 'VND') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format number with Vietnamese locale
     */
    static formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    /**
     * Format date in Vietnamese format
     */
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        return new Intl.DateTimeFormat('vi-VN', { ...defaultOptions, ...options }).format(new Date(date));
    }

    /**
     * Format relative time (e.g., "2 giờ trước")
     */
    static formatRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diffInSeconds = Math.floor((now - target) / 1000);

        if (diffInSeconds < 60) {
            return 'Vừa xong';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} phút trước`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `${diffInDays} ngày trước`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} tháng trước`;
        }

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} năm trước`;
    }

    /**
     * Debounce function
     */
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Generate random string
     */
    static generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate random ID
     */
    static generateId(prefix = '') {
        return `${prefix}${Date.now()}_${this.generateRandomString(6)}`;
    }

    /**
     * Validate email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number (Vietnamese format)
     */
    static isValidPhone(phone) {
        const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate URL
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize HTML
     */
    static sanitizeHtml(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    /**
     * Escape HTML
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Copy text to clipboard
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * Download file
     */
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Read file as text
     */
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Read file as data URL
     */
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get file size in human readable format
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension
     */
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * Check if file is image
     */
    static isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const extension = this.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(extension);
    }

    /**
     * Resize image
     */
    static resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Show loading spinner
     */
    static showLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.add('loading');
            element.style.position = 'relative';

            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            element.appendChild(spinner);
        }
    }

    /**
     * Hide loading spinner
     */
    static hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.remove('loading');
            const spinner = element.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    /**
     * Show confirmation dialog
     */
    static confirm(message, title = 'Xác nhận') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'admin-modal admin-confirm-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-admin btn-admin-secondary" data-action="cancel">Hủy</button>
                        <button type="button" class="btn-admin btn-admin-danger" data-action="confirm">Xác nhận</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.classList.add('show');

            const handleAction = (action) => {
                modal.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
                resolve(action === 'confirm');
            };

            modal.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    handleAction(btn.dataset.action);
                });
            });

            modal.querySelector('.modal-close').addEventListener('click', () => {
                handleAction('cancel');
            });
        });
    }

    /**
     * Show alert dialog
     */
    static alert(message, title = 'Thông báo', type = 'info') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = `admin-modal admin-alert-modal admin-alert-${type}`;
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-${this.getAlertIcon(type)}"></i>
                            ${title}
                        </h5>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-admin btn-admin-primary" data-action="ok">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.classList.add('show');

            const handleAction = () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
                resolve();
            };

            modal.querySelector('button').addEventListener('click', handleAction);
            modal.querySelector('.modal-close').addEventListener('click', handleAction);
        });
    }

    /**
     * Get alert icon
     */
    static getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Get query parameters
     */
    static getQueryParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    /**
     * Set query parameters
     */
    static setQueryParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url);
    }

    /**
     * Scroll to element
     */
    static scrollTo(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Check if element is in viewport
     */
    static isInViewport(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Get element offset
     */
    static getOffset(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return { top: 0, left: 0 };

        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset
        };
    }

    /**
     * Animate element
     */
    static animate(element, keyframes, options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return Promise.resolve();

        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            ...options
        });
    }

    /**
     * Fade in element
     */
    static fadeIn(element, duration = 300) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return Promise.resolve();

        element.style.opacity = '0';
        element.style.display = 'block';

        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    /**
     * Fade out element
     */
    static fadeOut(element, duration = 300) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return Promise.resolve();

        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration }).then(() => {
            element.style.display = 'none';
        });
    }

    /**
     * Slide down element
     */
    static slideDown(element, duration = 300) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return Promise.resolve();

        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';

        const height = element.scrollHeight;

        return this.animate(element, [
            { height: '0px' },
            { height: `${height}px` }
        ], { duration }).then(() => {
            element.style.height = 'auto';
        });
    }

    /**
     * Slide up element
     */
    static slideUp(element, duration = 300) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return Promise.resolve();

        const height = element.offsetHeight;
        element.style.height = `${height}px`;
        element.style.overflow = 'hidden';

        return this.animate(element, [
            { height: `${height}px` },
            { height: '0px' }
        ], { duration }).then(() => {
            element.style.display = 'none';
            element.style.height = 'auto';
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminUtils;
}
