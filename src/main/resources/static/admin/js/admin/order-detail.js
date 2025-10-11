/**
 * Order Detail Management JavaScript
 * Chi tiết đơn hàng - Liora Admin
 */

class OrderDetailManager {
    constructor() {
        this.baseUrl = '/admin/api/orders';
        this.orderId = this.getOrderIdFromUrl();
        this.orderData = null;
        this.init();
    }

    init() {
        if (this.orderId) {
            this.loadOrderDetail();
            this.bindEvents();
        } else {
            this.showAlert('error', 'Lỗi', 'Không tìm thấy mã đơn hàng');
            setTimeout(() => {
                window.location.href = '/admin/orders';
            }, 2000);
        }
    }

    bindEvents() {
        // Update status button
        $('#btnUpdateStatus').on('click', () => {
            this.showUpdateStatusModal();
        });

        // Print order button
        $('#btnPrintOrder').on('click', () => {
            this.printOrder();
        });

        // Modal events
        $('#updateStatusModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    getOrderIdFromUrl() {
        // Lấy từ URL path parameter trước (ví dụ: /admin/orders/detail/123)
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && !isNaN(lastPart)) {
                console.log('OrderId from path:', lastPart);
                return lastPart;
            }
        }
        
        // Nếu không có trong path, thử lấy từ query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const idFromQuery = urlParams.get('id');
        if (idFromQuery) {
            console.log('OrderId from query:', idFromQuery);
            return idFromQuery;
        }
        
        console.log('No orderId found in URL');
        return null;
    }

    async loadOrderDetail() {
        try {
            this.showLoading();
            
            console.log('Loading order detail for ID:', this.orderId);
            
            // Load all orders first (since we don't have a single order endpoint)
            const response = await fetch(this.baseUrl);
            
            if (!response.ok) {
                throw new Error('Không thể tải thông tin đơn hàng');
            }
            
            const orders = await response.json();
            console.log('Loaded orders:', orders);
            console.log('Looking for order with ID:', this.orderId);
            
            // Sử dụng idOrder thay vì id (theo cấu trúc OrderResponse)
            this.orderData = orders.find(order => {
                console.log('Comparing:', order.idOrder, 'with', this.orderId);
                return order.idOrder && order.idOrder.toString() === this.orderId.toString();
            });
            
            console.log('Found order:', this.orderData);
            
            if (!this.orderData) {
                throw new Error('Không tìm thấy đơn hàng');
            }
            
            this.renderOrderDetail();
            this.updateTimeline();
            
        } catch (error) {
            console.error('Error loading order detail:', error);
            this.showAlert('error', 'Lỗi', error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderOrderDetail() {
        const order = this.orderData;
        
        // Update page title - sử dụng idOrder
        document.title = `Chi tiết đơn hàng #${order.idOrder} - Liora Admin`;
        $('#pageOrderId').text(`#${order.idOrder}`);
        
        // Customer information - hiển thị ID user trực tiếp và tên (không có avatar, không có "Đang tải...")
        $('#customerId').text(order.userId || 'N/A');
        $('#customerName').text('N/A'); // Sẽ được cập nhật khi load customer info
        $('#customerEmail').text('N/A');
        $('#customerPhone').text('N/A');

        // Load customer info if userId available
        if (order.userId) {
            this.loadCustomerInfo(order.userId);
        }
        
        // Order information - sử dụng các trường đúng từ OrderResponse
        $('#orderIdDetail').text(`#${order.idOrder}`);

        // Tách thời gian thành ngày và giờ riêng
        const orderDateTime = new Date(order.orderDate);
        const dateString = new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(orderDateTime);
        const timeString = new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(orderDateTime);

        $('#orderDate').text(dateString);
        $('#orderTime').text(timeString);

        $('#paymentStatus').html(`<span class="badge ${this.getPaymentStatusClass(order.paymentStatus)}">${this.getPaymentStatusText(order.paymentStatus)}</span>`);
        $('#orderStatus').html(`<span class="badge ${this.getOrderStatusClass(order.orderStatus)}">${this.getOrderStatusText(order.orderStatus)}</span>`);
        
        // Payment method
        $('#paymentMethod').text(order.paymentMethod || 'Tiền mặt');
        
        // Order details - sử dụng trường total thay vì totalAmount
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total || 0);
        
        $('#totalAmount').text(formattedAmount);
        $('#summaryTotal').text(formattedAmount);
        
        // Shipping fee và discount
        const shippingFee = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.shippingFee || 0);
        $('#shippingFee').text(shippingFee);
        $('#summaryShippingFee').text(shippingFee);
        
        const discount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.totalDiscount || 0);
        $('#discount').text(discount);
        $('#summaryDiscount').text(`-${discount}`);
        
        // Calculate subtotal
        const subtotal = (order.total || 0) - (order.shippingFee || 0) + (order.totalDiscount || 0);
        $('#subtotal').text(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(subtotal));
        
        $('#orderNotes').text('Không có ghi chú'); // OrderResponse không có trường notes
        
        // Load order items - cần API riêng
        this.loadOrderItems(order.idOrder);
    }

    async loadCustomerInfo(userId) {
        try {
            // Giả sử có API để lấy thông tin user
            const response = await fetch(`/admin/api/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                $('#customerName').text(user.fullName || user.firstName + ' ' + user.lastName || 'N/A');
                $('#customerEmail').text(user.email || 'N/A');
                $('#customerPhone').text(user.phoneNumber || 'N/A');
                $('#customerAddress').text(user.address || 'N/A');
                if (user.avatar) {
                    $('#customerAvatar').attr('src', user.avatar);
                }
            }
        } catch (error) {
            console.error('Error loading customer info:', error);
            $('#customerName').text('N/A');
            $('#customerEmail').text('N/A');
            $('#customerPhone').text('N/A');
            $('#customerAddress').text('N/A');
        }
    }

    async loadAddressInfo(addressId) {
        try {
            // Giả sử có API để lấy thông tin address
            const response = await fetch(`/admin/api/addresses/${addressId}`);
            if (response.ok) {
                const address = await response.json();
                $('#shippingAddress').text(address.fullAddress || address.street || 'N/A');
            }
        } catch (error) {
            console.error('Error loading address info:', error);
            $('#shippingAddress').text('N/A');
        }
    }

    async loadOrderItems(orderId) {
        try {
            // Giả sử có API để lấy order items
            const response = await fetch(`/admin/api/orders/${orderId}/items`);
            if (response.ok) {
                const items = await response.json();
                this.renderOrderItems(items);
            } else {
                // Nếu không có API, hiển thị thông báo
                $('#orderItemsTable').html(`
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <i class="mdi mdi-information mdi-48px text-muted mb-3"></i>
                            <p class="text-muted">API chi tiết sản phẩm chưa được triển khai</p>
                        </td>
                    </tr>
                `);
            }
        } catch (error) {
            console.error('Error loading order items:', error);
            $('#orderItemsTable').html(`
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="mdi mdi-alert mdi-48px text-muted mb-3"></i>
                        <p class="text-muted">Không thể tải danh sách sản phẩm</p>
                    </td>
                </tr>
            `);
        }
    }

    renderOrderItems(items) {
        const tbody = $('#orderItemsTable');
        tbody.empty();

        if (items.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="mdi mdi-package-variant-closed mdi-48px text-muted mb-3"></i>
                        <p class="text-muted">Không có sản phẩm nào trong đơn hàng</p>
                    </td>
                </tr>
            `);
            return;
        }

        let subtotal = 0;
        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const row = `
                <tr>
                    <td>
                        <img src="${item.product?.image || '/admin/images/products/default-product.jpg'}" 
                             alt="${item.product?.name}" class="rounded" width="60" height="60">
                    </td>
                    <td>
                        <h6 class="mb-1">${item.product?.name || 'N/A'}</h6>
                        <small class="text-muted">SKU: ${item.product?.sku || 'N/A'}</small>
                    </td>
                    <td class="fw-medium">
                        ${new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                        }).format(item.price)}
                    </td>
                    <td>
                        <span class="badge bg-light text-dark">${item.quantity}</span>
                    </td>
                    <td class="fw-bold text-primary">
                        ${new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                        }).format(itemTotal)}
                    </td>
                    <td>
                        <span class="badge bg-success">Có sẵn</span>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        // Update subtotal
        $('#subtotal').text(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(subtotal));
    }

    updateTimeline() {
        const order = this.orderData;
        
        // Reset timeline
        $('.timeline-item').removeClass('active');
        
        // Always show ordered
        $('#timelineOrdered').addClass('active');
        $('#timelineOrderedDate').text(this.formatDate(order.orderDate));
        
        // Update based on order status
        if (order.orderStatus) {
            $('#timelineConfirmed').addClass('active');
            $('#timelineConfirmedDate').text('Đã xác nhận');
            
            if (order.paymentStatus) {
                $('#timelinePaid').addClass('active');
                $('#timelinePaidDate').text('Đã thanh toán');
                
                // If both confirmed and paid, assume shipped
                $('#timelineShipped').addClass('active');
                $('#timelineShippedDate').text('Đã giao hàng');
            }
        }
    }

    showUpdateStatusModal() {
        if (!this.orderData) return;
        
        $('#updateOrderId').val(this.orderData.idOrder); // Sử dụng idOrder
        $('#updatePaymentStatus').val(this.orderData.paymentStatus ? 'true' : 'false');
        $('#updateOrderStatus').val(this.orderData.orderStatus ? 'true' : 'false');
        $('#updateNotes').val('');
        
        $('#updateStatusModal').modal('show');
    }

    async saveOrderStatusDetail() {
        try {
            const orderId = $('#updateOrderId').val();
            const paymentStatus = $('#updatePaymentStatus').val() === 'true';
            const orderStatus = $('#updateOrderStatus').val() === 'true';

            const response = await fetch(`${this.baseUrl}/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentStatus: paymentStatus,
                    orderStatus: orderStatus
                })
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái đơn hàng');
            }

            $('#updateStatusModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái đơn hàng thành công');

            // Reload order detail
            await this.loadOrderDetail();

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
    }

    printOrder() {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        const order = this.orderData;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Đơn hàng #${order.id}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-section { margin-bottom: 20px; }
                    .info-title { font-weight: bold; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; font-size: 18px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LIORA FASHION</h1>
                    <h2>ĐơN HÀNG #${order.id}</h2>
                    <p>Ngày: ${this.formatDate(order.createdAt)}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin khách hàng:</div>
                    <p><strong>Họ tên:</strong> ${order.user?.fullName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.user?.email || 'N/A'}</p>
                    <p><strong>Điện thoại:</strong> ${order.user?.phoneNumber || 'N/A'}</p>
                    <p><strong>Địa chỉ giao hàng:</strong> ${order.shippingAddress || 'N/A'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Danh sách sản phẩm:</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tên sản phẩm</th>
                                <th>Đơn giá</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(order.orderItems || []).map(item => `
                                <tr>
                                    <td>${item.product?.name || 'N/A'}</td>
                                    <td>${new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(item.price)}</td>
                                    <td>${item.quantity}</td>
                                    <td>${new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="info-section">
                    <p class="total">Tổng tiền: ${new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(order.totalAmount)}</p>
                    <p><strong>Trạng thái thanh toán:</strong> ${this.getPaymentStatusText(order.paymentStatus)}</p>
                    <p><strong>Trạng thái đơn hàng:</strong> ${this.getOrderStatusText(order.orderStatus)}</p>
                </div>
                
                ${order.notes ? `
                <div class="info-section">
                    <div class="info-title">Ghi chú:</div>
                    <p>${order.notes}</p>
                </div>
                ` : ''}
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    // Helper methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getPaymentStatusClass(status) {
        return status ? 'bg-success' : 'bg-warning';
    }

    getPaymentStatusText(status) {
        return status ? 'Đã thanh toán' : 'Chưa thanh toán';
    }

    getOrderStatusClass(status) {
        return status ? 'bg-primary' : 'bg-secondary';
    }

    getOrderStatusText(status) {
        return status ? 'Đã xử lý' : 'Chờ xử lý';
    }

    showLoading() {
        $('#loadingSpinner').removeClass('d-none');
    }

    hideLoading() {
        $('#loadingSpinner').addClass('d-none');
    }

    clearModal() {
        $('#updateStatusForm')[0].reset();
    }

    showAlert(type, title, message) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alert = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <strong>${title}:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        $('#alertContainer').html(alert);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').fadeOut();
        }, 5000);
    }
}

// Initialize when document is ready
$(document).ready(function() {
    window.orderDetailManager = new OrderDetailManager();
});

// Save order status function for modal
function saveOrderStatusDetail() {
    orderDetailManager.saveOrderStatusDetail();
}
