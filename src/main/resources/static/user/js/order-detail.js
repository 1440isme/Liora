// Order Detail Page JavaScript
class OrderDetailManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize any necessary functionality
        console.log('Order Detail Manager initialized');
    }

    showToast(message, type = 'info') {
        const toastElement = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastHeader = toastElement.querySelector('.toast-header i');
        
        // Set message
        toastMessage.textContent = message;
        
        // Set icon and color based on type - chỉ icon màu hồng
        toastHeader.className = 'fas me-2';
        switch (type) {
            case 'success':
                toastHeader.classList.add('fa-check-circle', 'text-success');
                break;
            case 'error':
                toastHeader.classList.add('fa-exclamation-circle', 'text-danger');
                break;
            case 'warning':
                toastHeader.classList.add('fa-exclamation-triangle', 'text-warning');
                break;
            default:
                toastHeader.classList.add('fa-info-circle');
                toastHeader.style.color = 'var(--pink-primary)';
        }
        
        // Show toast
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }

    async reorderOrder(orderId) {
        try {
            // TODO: Implement reorder functionality
            this.showToast('Tính năng mua lại sẽ được cập nhật sớm', 'info');
        } catch (error) {
            console.error('Error reordering:', error);
            this.showToast('Có lỗi xảy ra khi thực hiện mua lại', 'error');
        }
    }

    async cancelOrder(orderId) {
        try {
            if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
                this.showToast('Đang hủy đơn hàng...', 'info');
                
                const token = localStorage.getItem('access_token');
                if (!token) {
                    this.showToast('Vui lòng đăng nhập để thực hiện thao tác này', 'error');
                    return;
                }

                console.log('Cancelling order:', orderId);
                console.log('Token:', token ? 'Present' : 'Missing');

                const response = await fetch(`/order/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (response.ok) {
                    this.showToast('Hủy đơn hàng thành công', 'success');
                    // Reload trang để cập nhật trạng thái
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    const errorData = await response.json();
                    console.log('Error response:', errorData);
                    this.showToast(errorData.message || 'Không thể hủy đơn hàng', 'error');
                }
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            this.showToast('Có lỗi xảy ra khi hủy đơn hàng', 'error');
        }
    }
}

// Initialize when DOM is loaded using jQuery
$(document).ready(function() {
    try {
        console.log('DOM loaded, initializing OrderDetailManager...');
        window.orderDetailManager = new OrderDetailManager();
        console.log('OrderDetailManager initialized:', window.orderDetailManager);
    } catch (error) {
        console.error('Error initializing OrderDetailManager:', error);
    }
});

// Global function for reorder button
function reorderOrder(orderId) {
    if (window.orderDetailManager) {
        window.orderDetailManager.reorderOrder(orderId);
    }
}

// Global function for cancel order button
function cancelOrder(orderId) {
    try {
        console.log('cancelOrder function called with orderId:', orderId);
        if (window.orderDetailManager) {
            console.log('orderDetailManager found, calling cancelOrder method');
            window.orderDetailManager.cancelOrder(orderId);
        } else {
            console.error('orderDetailManager not found!');
            alert('Lỗi: Không thể khởi tạo order detail manager');
        }
    } catch (error) {
        console.error('Error in cancelOrder function:', error);
        alert('Lỗi: ' + error.message);
    }
}
