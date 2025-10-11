/**
 * Order Management JavaScript
 * Quản lý đơn hàng - Liora Admin
 */

class OrderManager {
    constructor() {
        this.baseUrl = '/admin/api/orders';
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 0;
        this.orders = [];
        this.filteredOrders = [];
        this.init();
    }

    init() {
        this.loadOrders();
        this.bindEvents();
        this.loadStatistics();
    }

    bindEvents() {
        // Search functionality
        $('#searchOrder').on('keyup', (e) => {
            if (e.key === 'Enter') {
                this.searchOrders();
            }
        });

        $('#btnSearch').on('click', () => {
            this.searchOrders();
        });

        // Filter events
        $('#filterPaymentStatus').on('change', () => {
            this.filterOrders();
        });

        $('#filterOrderStatus').on('change', () => {
            this.filterOrders();
        });

        $('#filterDateFrom, #filterDateTo').on('change', () => {
            this.filterOrders();
        });

        // Refresh button
        $('#btnRefresh').on('click', () => {
            this.refreshData();
        });

        // Export buttons
        $('#btnExportExcel').on('click', () => {
            this.exportToExcel();
        });

        $('#btnPrintReport').on('click', () => {
            this.printReport();
        });

        // Modal events
        $('#orderDetailModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    async loadOrders() {
        try {
            this.showLoading();
            const response = await fetch(this.baseUrl);

            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn hàng');
            }

            this.orders = await response.json();
            this.filteredOrders = [...this.orders];
            this.renderOrderTable();
            this.updatePagination();

        } catch (error) {
            console.error('Error loading orders:', error);
            this.showAlert('error', 'Lỗi', 'Không thể tải danh sách đơn hàng');
        } finally {
            this.hideLoading();
        }
    }

    async loadStatistics() {
        try {
            // Load total orders count
            const totalResponse = await fetch(this.baseUrl);
            const allOrders = await totalResponse.json();

            // Load paid orders count
            const paidResponse = await fetch(`${this.baseUrl}/payment-status?paymentStatus=true`);
            const paidOrders = await paidResponse.json();

            // Load pending orders count
            const pendingResponse = await fetch(`${this.baseUrl}/order-status?orderStatus=false`);
            const pendingOrders = await pendingResponse.json();

            // Load total revenue
            const revenueResponse = await fetch(`${this.baseUrl}/revenue`);
            const totalRevenue = await revenueResponse.json();

            this.updateStatistics({
                total: allOrders.length,
                paid: paidOrders.length,
                pending: pendingOrders.length,
                revenue: totalRevenue
            });

        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    updateStatistics(stats) {
        $('#totalOrders').text(stats.total.toLocaleString());
        $('#paidOrders').text(stats.paid.toLocaleString());
        $('#pendingOrders').text(stats.pending.toLocaleString());
        $('#totalRevenue').text(new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(stats.revenue));
    }

    renderOrderTable() {
        const tbody = $('#orderTableBody');
        tbody.empty();

        if (this.filteredOrders.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="mdi mdi-cart-off mdi-48px text-muted mb-3"></i>
                        <p class="text-muted">Không có đơn hàng nào</p>
                    </td>
                </tr>
            `);
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);

        pageOrders.forEach((order, index) => {
            const orderDateTime = new Date(order.orderDate);
            const dateString = new Intl.DateTimeFormat('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(orderDateTime);
            const timeString = new Intl.DateTimeFormat('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            }).format(orderDateTime);

            const row = `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>
                        <span class="fw-bold text-primary">#${order.idOrder}</span>
                    </td>
                    <td>
                        <div>
                            <span class="fw-medium">${dateString}</span>
                            <br>
                            <small class="text-muted">${timeString}</small>
                        </div>
                    </td>
                    <td>
                        <div>
                            <span class="fw-bold text-primary">ID: ${order.userId || 'N/A'}</span>
                            <br>
                            <small class="text-muted" id="customerName-${order.idOrder}">Đang tải...</small>
                        </div>
                    </td>
                    <td>
                        <span class="fw-bold text-success">
                            ${new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(order.total || 0)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${this.getPaymentStatusClass(order.paymentStatus)}">
                            ${this.getPaymentStatusText(order.paymentStatus)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${this.getOrderStatusClass(order.orderStatus)}">
                            ${this.getOrderStatusText(order.orderStatus)}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-outline-primary" 
                                    onclick="orderManager.viewOrderDetail(${order.idOrder})"
                                    title="Xem chi tiết">
                                <i class="mdi mdi-eye"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-success" 
                                    onclick="orderManager.updateOrderStatus(${order.idOrder})"
                                    title="Cập nhật trạng thái">
                                <i class="mdi mdi-pencil"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);

            // Load customer name asynchronously
            if (order.userId) {
                this.loadCustomerName(order.userId, order.idOrder);
            }
        });
    }

    async loadCustomerName(userId, orderId) {
        try {
            // Nếu userId null/undefined/0 thì là khách
            if (!userId || userId === 0) {
                $(`#customerName-${orderId}`).text('Khách');
                return;
            }

            const response = await fetch(`/admin/api/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                console.log('User data:', user); // Debug log

                // Thử các cách khác nhau để lấy tên
                let customerName = 'Khách';

                if (user.fullName && user.fullName !== 'null' && user.fullName.trim() !== '') {
                    customerName = user.fullName;
                } else if (user.firstName || user.lastName) {
                    // Kiểm tra xem có firstName hoặc lastName không
                    const firstName = (user.firstName && user.firstName !== 'null' && user.firstName !== 'undefined') ? user.firstName : '';
                    const lastName = (user.lastName && user.lastName !== 'null' && user.lastName !== 'undefined') ? user.lastName : '';

                    if (firstName || lastName) {
                        customerName = `${firstName} ${lastName}`.trim();
                    } else {
                        customerName = 'Khách';
                    }
                } else if (user.username && user.username !== 'guest') {
                    customerName = user.username;
                } else {
                    customerName = 'Khách';
                }

                $(`#customerName-${orderId}`).text(customerName);
            } else {
                console.error('API response not ok:', response.status);
                $(`#customerName-${orderId}`).text('Khách');
            }
        } catch (error) {
            console.error('Error loading customer name:', error);
            // Nếu API không hoạt động hoặc lỗi, hiển thị "Khách"
            $(`#customerName-${orderId}`).text('Khách');
        }
    }

    async viewOrderDetail(orderId) {
        try {
            const order = this.orders.find(o => o.idOrder === orderId); // Sử dụng idOrder
            if (!order) {
                this.showAlert('error', 'Lỗi', 'Không tìm thấy đơn hàng');
                return;
            }

            // Populate modal with order details
            $('#modalOrderId').text(`#${order.idOrder}`);
            $('#modalCustomerName').text(`User ID: ${order.userId || 'N/A'}`);
            $('#modalCustomerEmail').text('Đang tải...');
            $('#modalCustomerPhone').text('Đang tải...');
            $('#modalOrderDate').text(this.formatDate(order.orderDate));
            $('#modalTotalAmount').text(new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(order.total || 0));
            $('#modalPaymentStatus').html(`<span class="badge ${this.getPaymentStatusClass(order.paymentStatus)}">${this.getPaymentStatusText(order.paymentStatus)}</span>`);
            $('#modalOrderStatus').html(`<span class="badge ${this.getOrderStatusClass(order.orderStatus)}">${this.getOrderStatusText(order.orderStatus)}</span>`);
            $('#modalShippingAddress').text(`Address ID: ${order.idAddress || 'N/A'}`);
            $('#modalNotes').text('Không có ghi chú');

            // Populate order items - tạm thời hiển thị thông báo
            const itemsContainer = $('#modalOrderItems');
            itemsContainer.empty();
            itemsContainer.append('<p class="text-muted text-center">API chi tiết sản phẩm chưa được triển khai</p>');

            // Load thông tin user nếu có userId
            if (order.userId) {
                this.loadUserInfoForModal(order.userId);
            }

            // Load thông tin address nếu có idAddress
            if (order.idAddress) {
                this.loadAddressInfoForModal(order.idAddress);
            }

            $('#orderDetailModal').modal('show');

        } catch (error) {
            console.error('Error viewing order detail:', error);
            this.showAlert('error', 'Lỗi', 'Không thể xem chi tiết đơn hàng');
        }
    }

    async loadUserInfoForModal(userId) {
        try {
            const response = await fetch(`/admin/api/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                $('#modalCustomerName').text(user.fullName || user.firstName + ' ' + user.lastName || 'N/A');
                $('#modalCustomerEmail').text(user.email || 'N/A');
                $('#modalCustomerPhone').text(user.phoneNumber || 'N/A');
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async loadAddressInfoForModal(addressId) {
        try {
            const response = await fetch(`/admin/api/addresses/${addressId}`);
            if (response.ok) {
                const address = await response.json();
                $('#modalShippingAddress').text(address.fullAddress || address.street || 'N/A');
            }
        } catch (error) {
            console.error('Error loading address info:', error);
        }
    }

    async updateOrderStatus(orderId) {
        try {
            const order = this.orders.find(o => o.idOrder === orderId); // Sử dụng idOrder
            if (!order) {
                this.showAlert('error', 'Lỗi', 'Không tìm thấy đơn hàng');
                return;
            }

            // Show update status modal
            $('#updateOrderId').val(orderId);
            $('#updatePaymentStatus').val(order.paymentStatus ? 'true' : 'false');
            $('#updateOrderStatus').val(order.orderStatus ? 'true' : 'false');
            $('#updateStatusModal').modal('show');

        } catch (error) {
            console.error('Error preparing status update:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
    }

    async saveOrderStatus() {
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
            await this.loadOrders();
            await this.loadStatistics();

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
        }
    }

    searchOrders() {
        const searchTerm = $('#searchOrder').val().toLowerCase().trim();

        if (!searchTerm) {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order =>
                order.idOrder.toString().includes(searchTerm) ||
                (order.userId && order.userId.toString().includes(searchTerm)) ||
                (order.paymentMethod && order.paymentMethod.toLowerCase().includes(searchTerm))
            );
        }

        this.currentPage = 1;
        this.renderOrderTable();
        this.updatePagination();
    }

    filterOrders() {
        const paymentStatus = $('#filterPaymentStatus').val();
        const orderStatus = $('#filterOrderStatus').val();
        const dateFrom = $('#filterDateFrom').val();
        const dateTo = $('#filterDateTo').val();

        this.filteredOrders = this.orders.filter(order => {
            let matches = true;

            // Filter by payment status
            if (paymentStatus !== '') {
                matches = matches && (order.paymentStatus === (paymentStatus === 'true'));
            }

            // Filter by order status
            if (orderStatus !== '') {
                matches = matches && (order.orderStatus === (orderStatus === 'true'));
            }

            // Filter by date range
            if (dateFrom) {
                const orderDate = new Date(order.orderDate);
                const fromDate = new Date(dateFrom);
                matches = matches && (orderDate >= fromDate);
            }

            if (dateTo) {
                const orderDate = new Date(order.orderDate);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                matches = matches && (orderDate <= toDate);
            }

            return matches;
        });

        this.currentPage = 1;
        this.renderOrderTable();
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize);

        const pagination = $('#pagination');
        pagination.empty();

        if (this.totalPages <= 1) return;

        // Previous button
        pagination.append(`
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="orderManager.goToPage(${this.currentPage - 1})">Trước</a>
            </li>
        `);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pagination.append(`
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="orderManager.goToPage(${i})">${i}</a>
                </li>
            `);
        }

        // Next button
        pagination.append(`
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="orderManager.goToPage(${this.currentPage + 1})">Sau</a>
            </li>
        `);

        // Update info
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.filteredOrders.length);
        $('#paginationInfo').text(`Hiển thị ${start}-${end} trong tổng số ${this.filteredOrders.length} đơn hàng`);
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderOrderTable();
            this.updatePagination();
        }
    }

    async refreshData() {
        this.currentPage = 1;
        $('#searchOrder').val('');
        $('#filterPaymentStatus').val('');
        $('#filterOrderStatus').val('');
        $('#filterDateFrom').val('');
        $('#filterDateTo').val('');

        await this.loadOrders();
        await this.loadStatistics();
        this.showAlert('success', 'Thành công', 'Dữ liệu đã được làm mới');
    }

    exportToExcel() {
        // Implementation for Excel export
        this.showAlert('info', 'Thông báo', 'Chức năng xuất Excel đang được phát triển');
    }

    printReport() {
        // Implementation for printing
        window.print();
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
        // Clear modal content when closed
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
    window.orderManager = new OrderManager();
});

// Save order status function for modal
function saveOrderStatus() {
    orderManager.saveOrderStatus();
}
