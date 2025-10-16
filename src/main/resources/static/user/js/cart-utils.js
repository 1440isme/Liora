/**
 * Cart Utils - Shared cart functionality
 * Centralized cart operations to avoid code duplication
 */
window.CartUtils = {
    
    /**
     * Add product to cart - Single function for all pages
     * @param {number} productId - Product ID to add
     * @param {number} quantity - Quantity (default: 1)
     * @param {string} productName - Product name for display (optional)
     */
    async addToCart(productId, quantity = 1, productName = null) {
        try {
            // Check authentication
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'warning');
                return false;
            }

            // Get current cart
            const cartResponse = await fetch('/cart/api/current', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!cartResponse.ok) {
                throw new Error('Không thể lấy thông tin giỏ hàng');
            }

            const cartData = await cartResponse.json();
            const cartId = cartData.result?.idCart;

            if (!cartId) {
                this.showToast('Không thể lấy thông tin giỏ hàng', 'error');
                return false;
            }

            // Add product to cart via API
            const addResponse = await fetch(`/CartProduct/${cartId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity
                })
            });

            if (!addResponse.ok) {
                const errorData = await addResponse.json();
                throw new Error(errorData.message || 'Failed to add product to cart');
            }

            // Show success message
            const message = productName 
                ? `Đã thêm "${productName}" vào giỏ hàng!`
                : 'Đã thêm sản phẩm vào giỏ hàng!';
            this.showToast(message, 'success');

            // Update cart display
            if (window.app && window.app.updateCartDisplay) {
                window.app.updateCartDisplay();
            }

            return true;

        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showToast('Không thể thêm sản phẩm vào giỏ hàng', 'error');
            return false;
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Use existing toast system
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            // Fallback to alert
            alert(message);
        }
    }
};
