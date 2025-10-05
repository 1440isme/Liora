/**
 * Order Table Component
 * Handles order table functionality, filtering, sorting, and actions
 */

class OrderTable {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            ajax: true,
            pagination: true,
            search: true,
            sort: true,
            filter: true,
            bulkActions: true,
            ...options
        };

        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filters = {};
        this.selectedItems = new Set();

        this.init();
    }

    init() {
        this.createTable();
        this.bindEvents();
        this.loadData();
    }

    /**
     * Create table HTML structure
     */
    createTable() {
        this.container.innerHTML = `
            <div class="order-table-container">
                <div class="order-table-header">
                    <h3 class="table-title">Danh sách đơn hàng</h3>
                    <div class="table-actions">
                        <button class="btn-admin btn-admin-secondary" id="exportOrdersBtn">
                            <i class="fas fa-download"></i> Xuất Excel
                        </button>
                        <button class="btn-admin btn-admin-danger" id="bulkUpdateBtn" style="display: none;">
                            <i class="fas fa-edit"></i> Cập nhật hàng loạt
                        </button>
                    </div>
                </div>
                
                <div class="order-filters" id="orderFilters">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Tìm kiếm</label>
                            <input type="text" class="filter-control" id="searchInput" placeholder="Tìm theo mã đơn hàng, tên khách hàng...">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Trạng thái</label>
                            <select class="filter-control" id="statusFilter">
                                <option value="">Tất cả trạng thái</option>
                                <option value="pending">Chờ xác nhận</option>
                                <option value="processing">Đang xử lý</option>
                                <option value="shipped">Đã giao hàng</option>
                                <option value="delivered">Đã giao</option>
                                <option value="cancelled">Đã hủy</option>
                                <option value="refunded">Đã hoàn tiền</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Thanh toán</label>
                            <select class="filter-control" id="paymentFilter">
                                <option value="">Tất cả</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="pending">Chờ thanh toán</option>
                                <option value="failed">Thanh toán thất bại</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Từ ngày</label>
                            <input type="date" class="filter-control" id="fromDateFilter">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Đến ngày</label>
                            <input type="date" class="filter-control" id="toDateFilter">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Giá trị đơn hàng</label>
                            <select class="filter-control" id="amountFilter">
                                <option value="">Tất cả</option>
                                <option value="0-100000">Dưới 100.000đ</option>
                                <option value="100000-500000">100.000đ - 500.000đ</option>
                                <option value="500000-1000000">500.000đ - 1.000.000đ</option>
                                <option value="1000000-">Trên 1.000.000đ</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button class="btn-admin btn-admin-primary" id="applyFiltersBtn">
                                <i class="fas fa-search"></i> Lọc
                            </button>
                            <button class="btn-admin btn-admin-secondary" id="clearFiltersBtn">
                                <i class="fas fa-times"></i> Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="admin-table order-table" id="orderTable">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="selectAllCheckbox">
                                </th>
                                <th data-sort="orderNumber">Mã đơn hàng</th>
                                <th data-sort="customer">Khách hàng</th>
                                <th data-sort="items">Sản phẩm</th>
                                <th data-sort="total">Tổng tiền</th>
                                <th data-sort="status">Trạng thái</th>
                                <th data-sort="paymentStatus">Thanh toán</th>
                                <th data-sort="createdAt">Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="orderTableBody">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="pagination-container" id="paginationContainer">
                    <div class="pagination-info">
                        Hiển thị <span id="showingFrom">0</span> - <span id="showingTo">0</span> 
                        trong tổng số <span id="totalItems">0</span> đơn hàng
                    </div>
                    <div class="pagination" id="pagination">
                        <!-- Pagination will be generated here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search
        const searchInput = this.container.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', AdminUtils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.filterData();
                this.renderTable();
            }, 300));
        }

        // Filters
        const filterInputs = this.container.querySelectorAll('.filter-control');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFilters();
                this.filterData();
                this.renderTable();
            });
        });

        // Apply filters button
        const applyFiltersBtn = this.container.querySelector('#applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.updateFilters();
                this.filterData();
                this.renderTable();
            });
        }

        // Clear filters button
        const clearFiltersBtn = this.container.querySelector('#clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = this.container.querySelector('#selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk actions
        const bulkUpdateBtn = this.container.querySelector('#bulkUpdateBtn');
        if (bulkUpdateBtn) {
            bulkUpdateBtn.addEventListener('click', () => {
                this.handleBulkUpdate();
            });
        }

        // Export button
        const exportBtn = this.container.querySelector('#exportOrdersBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExport();
            });
        }

        // Sort headers
        const sortHeaders = this.container.querySelectorAll('th[data-sort]');
        sortHeaders.forEach(header => {
            header.addEventListener('click', () => {
                this.handleSort(header.dataset.sort);
            });
        });
    }

    /**
     * Load data from API
     */
    async loadData() {
        try {
            AdminUtils.showLoading(this.container);

            const params = {
                page: this.currentPage,
                size: this.pageSize,
                search: this.searchTerm,
                ...this.filters
            };

            const response = await adminAjax.getOrders(params);
            this.data = response.content || response.data || [];
            this.totalItems = response.totalElements || response.total || 0;
            this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.pageSize);

            this.filteredData = [...this.data];
            this.renderTable();

        } catch (error) {
            console.error('Error loading orders:', error);
            adminAjax.showNotification('Lỗi khi tải danh sách đơn hàng', 'error');
        } finally {
            AdminUtils.hideLoading(this.container);
        }
    }

    /**
     * Update filters from form inputs
     */
    updateFilters() {
        this.filters = {
            status: this.container.querySelector('#statusFilter')?.value || '',
            paymentStatus: this.container.querySelector('#paymentFilter')?.value || '',
            fromDate: this.container.querySelector('#fromDateFilter')?.value || '',
            toDate: this.container.querySelector('#toDateFilter')?.value || '',
            amountRange: this.container.querySelector('#amountFilter')?.value || ''
        };
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.searchTerm = '';
        this.filters = {};

        // Reset form inputs
        this.container.querySelector('#searchInput').value = '';
        this.container.querySelector('#statusFilter').value = '';
        this.container.querySelector('#paymentFilter').value = '';
        this.container.querySelector('#fromDateFilter').value = '';
        this.container.querySelector('#toDateFilter').value = '';
        this.container.querySelector('#amountFilter').value = '';

        this.filterData();
        this.renderTable();
    }

    /**
     * Filter data based on search term and filters
     */
    filterData() {
        this.filteredData = this.data.filter(item => {
            // Search filter
            if (this.searchTerm) {
                const searchLower = this.searchTerm.toLowerCase();
                const matchesSearch =
                    item.orderNumber.toLowerCase().includes(searchLower) ||
                    item.customer?.name.toLowerCase().includes(searchLower) ||
                    item.customer?.email.toLowerCase().includes(searchLower);

                if (!matchesSearch) return false;
            }

            // Status filter
            if (this.filters.status && item.status !== this.filters.status) {
                return false;
            }

            // Payment status filter
            if (this.filters.paymentStatus && item.paymentStatus !== this.filters.paymentStatus) {
                return false;
            }

            // Date range filter
            if (this.filters.fromDate || this.filters.toDate) {
                const orderDate = new Date(item.createdAt);
                if (this.filters.fromDate) {
                    const fromDate = new Date(this.filters.fromDate);
                    if (orderDate < fromDate) return false;
                }
                if (this.filters.toDate) {
                    const toDate = new Date(this.filters.toDate);
                    toDate.setHours(23, 59, 59, 999);
                    if (orderDate > toDate) return false;
                }
            }

            // Amount range filter
            if (this.filters.amountRange) {
                const total = item.total;
                const [min, max] = this.filters.amountRange.split('-').map(v => v ? parseInt(v) : null);

                if (min !== null && total < min) return false;
                if (max !== null && total > max) return false;
            }

            return true;
        });
    }

    /**
     * Handle sorting
     */
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.sortData();
        this.renderTable();
    }

    /**
     * Sort data
     */
    sortData() {
        this.filteredData.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];

            // Handle nested properties
            if (this.sortColumn === 'customer') {
                aVal = a.customer?.name || '';
                bVal = b.customer?.name || '';
            }

            // Convert to comparable values
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Render table with current data
     */
    renderTable() {
        const tbody = this.container.querySelector('#orderTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredData.length);
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(item => this.renderTableRow(item)).join('');

        this.updatePaginationInfo();
        this.renderPagination();
        this.updateBulkActions();
    }

    /**
     * Render single table row
     */
    renderTableRow(item) {
        const statusClass = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered',
            'cancelled': 'status-cancelled',
            'refunded': 'status-refunded'
        }[item.status] || 'status-pending';

        const statusText = {
            'pending': 'Chờ xác nhận',
            'processing': 'Đang xử lý',
            'shipped': 'Đã giao hàng',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy',
            'refunded': 'Đã hoàn tiền'
        }[item.status] || 'Không xác định';

        const paymentClass = {
            'paid': 'payment-paid',
            'pending': 'payment-pending',
            'failed': 'payment-failed'
        }[item.paymentStatus] || 'payment-pending';

        const paymentText = {
            'paid': 'Đã thanh toán',
            'pending': 'Chờ thanh toán',
            'failed': 'Thanh toán thất bại'
        }[item.paymentStatus] || 'Chờ thanh toán';

        const orderItemsHtml = this.renderOrderItems(item.items);

        return `
            <tr data-id="${item.id}">
                <td>
                    <input type="checkbox" class="item-checkbox" value="${item.id}">
                </td>
                <td>
                    <a href="#" class="order-number" data-action="view" data-id="${item.id}">
                        ${AdminUtils.escapeHtml(item.orderNumber)}
                    </a>
                </td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${AdminUtils.escapeHtml(item.customer?.name || 'N/A')}</div>
                        <div class="customer-email">${AdminUtils.escapeHtml(item.customer?.email || '')}</div>
                    </div>
                </td>
                <td>
                    <div class="order-items">
                        ${orderItemsHtml}
                    </div>
                </td>
                <td>
                    <div class="order-total">${AdminUtils.formatCurrency(item.total)}</div>
                </td>
                <td>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="payment-status">
                        <span class="payment-indicator ${paymentClass}"></span>
                        <span>${paymentText}</span>
                    </div>
                </td>
                <td>${AdminUtils.formatDate(item.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn-view" data-action="view" data-id="${item.id}" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-edit" data-action="edit" data-id="${item.id}" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn action-btn-print" data-action="print" data-id="${item.id}" title="In đơn hàng">
                            <i class="fas fa-print"></i>
                        </button>
                        ${item.status === 'pending' ? `
                            <button class="action-btn action-btn-cancel" data-action="cancel" data-id="${item.id}" title="Hủy đơn hàng">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render order items
     */
    renderOrderItems(items) {
        if (!items || items.length === 0) return 'N/A';

        const maxItems = 3;
        const displayItems = items.slice(0, maxItems);
        const remainingCount = items.length - maxItems;

        let html = displayItems.map(item => `
            <div class="order-item">
                <img src="${item.image || '/admin/images/products/placeholder.jpg'}" 
                     alt="${item.name}" class="order-item-image">
                <div class="order-item-info">
                    <div class="order-item-name">${AdminUtils.escapeHtml(item.name)}</div>
                    <div class="order-item-qty">x${item.quantity}</div>
                </div>
            </div>
        `).join('');

        if (remainingCount > 0) {
            html += `<div class="order-item-more">+${remainingCount} sản phẩm khác</div>`;
        }

        return html;
    }

    /**
     * Update pagination info
     */
    updatePaginationInfo() {
        const showingFrom = this.container.querySelector('#showingFrom');
        const showingTo = this.container.querySelector('#showingTo');
        const totalItems = this.container.querySelector('#totalItems');

        if (showingFrom) showingFrom.textContent = this.filteredData.length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
        if (showingTo) showingTo.textContent = Math.min(this.currentPage * this.pageSize, this.filteredData.length);
        if (totalItems) totalItems.textContent = this.filteredData.length;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const pagination = this.container.querySelector('#pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';

        // Previous button
        html += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        html += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = html;

        // Bind pagination events
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderTable();
                }
            });
        });
    }

    /**
     * Toggle select all
     */
    toggleSelectAll(checked) {
        const checkboxes = this.container.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedItems.add(checkbox.value);
            } else {
                this.selectedItems.delete(checkbox.value);
            }
        });
        this.updateBulkActions();
    }

    /**
     * Update bulk actions visibility
     */
    updateBulkActions() {
        const bulkUpdateBtn = this.container.querySelector('#bulkUpdateBtn');
        if (bulkUpdateBtn) {
            bulkUpdateBtn.style.display = this.selectedItems.size > 0 ? 'inline-block' : 'none';
        }
    }

    /**
     * Handle bulk update
     */
    async handleBulkUpdate() {
        if (this.selectedItems.size === 0) return;

        // This would typically open a modal for bulk status update
        const newStatus = prompt('Nhập trạng thái mới (pending, processing, shipped, delivered, cancelled):');
        if (!newStatus) return;

        try {
            AdminUtils.showLoading(this.container);
            await adminAjax.bulkUpdateOrders(Array.from(this.selectedItems), { status: newStatus });
            adminAjax.showNotification('Cập nhật đơn hàng thành công', 'success');
            this.selectedItems.clear();
            this.loadData();
        } catch (error) {
            adminAjax.showNotification('Lỗi khi cập nhật đơn hàng', 'error');
        } finally {
            AdminUtils.hideLoading(this.container);
        }
    }

    /**
     * Handle export
     */
    handleExport() {
        adminAjax.exportOrders('excel', this.filters);
    }

    /**
     * Refresh table data
     */
    refresh() {
        this.loadData();
    }

    /**
     * Destroy table
     */
    destroy() {
        // Clean up event listeners and data
        this.container.innerHTML = '';
        this.data = [];
        this.filteredData = [];
        this.selectedItems.clear();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderTable;
}
