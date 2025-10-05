/**
 * User Table Component
 * Handles user table functionality, filtering, sorting, and actions
 */

class UserTable {
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
            <div class="user-table-container">
                <div class="user-table-header">
                    <h3 class="table-title">Danh sách người dùng</h3>
                    <div class="table-actions">
                        <button class="btn-admin btn-admin-primary" id="addUserBtn">
                            <i class="fas fa-plus"></i> Thêm người dùng
                        </button>
                        <button class="btn-admin btn-admin-secondary" id="exportUsersBtn">
                            <i class="fas fa-download"></i> Xuất Excel
                        </button>
                        <button class="btn-admin btn-admin-danger" id="bulkUpdateBtn" style="display: none;">
                            <i class="fas fa-edit"></i> Cập nhật hàng loạt
                        </button>
                    </div>
                </div>
                
                <div class="user-filters" id="userFilters">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label class="filter-label">Tìm kiếm</label>
                            <input type="text" class="filter-control" id="searchInput" placeholder="Tìm theo tên, email, số điện thoại...">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Vai trò</label>
                            <select class="filter-control" id="roleFilter">
                                <option value="">Tất cả vai trò</option>
                                <option value="admin">Quản trị viên</option>
                                <option value="manager">Quản lý</option>
                                <option value="user">Người dùng</option>
                                <option value="guest">Khách</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Trạng thái</label>
                            <select class="filter-control" id="statusFilter">
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                                <option value="pending">Chờ xác nhận</option>
                                <option value="banned">Bị cấm</option>
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
                            <label class="filter-label">Số đơn hàng</label>
                            <select class="filter-control" id="orderCountFilter">
                                <option value="">Tất cả</option>
                                <option value="0">Chưa có đơn hàng</option>
                                <option value="1-5">1-5 đơn hàng</option>
                                <option value="6-20">6-20 đơn hàng</option>
                                <option value="20-">Trên 20 đơn hàng</option>
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
                    <table class="admin-table user-table" id="userTable">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="selectAllCheckbox">
                                </th>
                                <th data-sort="avatar">Ảnh đại diện</th>
                                <th data-sort="name">Thông tin</th>
                                <th data-sort="role">Vai trò</th>
                                <th data-sort="status">Trạng thái</th>
                                <th data-sort="lastLogin">Hoạt động cuối</th>
                                <th data-sort="orderCount">Đơn hàng</th>
                                <th data-sort="createdAt">Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="pagination-container" id="paginationContainer">
                    <div class="pagination-info">
                        Hiển thị <span id="showingFrom">0</span> - <span id="showingTo">0</span> 
                        trong tổng số <span id="totalItems">0</span> người dùng
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

        // Add user button
        const addUserBtn = this.container.querySelector('#addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.handleAddUser();
            });
        }

        // Export button
        const exportBtn = this.container.querySelector('#exportUsersBtn');
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

            const response = await adminAjax.getUsers(params);
            this.data = response.content || response.data || [];
            this.totalItems = response.totalElements || response.total || 0;
            this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.pageSize);

            this.filteredData = [...this.data];
            this.renderTable();

        } catch (error) {
            console.error('Error loading users:', error);
            adminAjax.showNotification('Lỗi khi tải danh sách người dùng', 'error');
        } finally {
            AdminUtils.hideLoading(this.container);
        }
    }

    /**
     * Update filters from form inputs
     */
    updateFilters() {
        this.filters = {
            role: this.container.querySelector('#roleFilter')?.value || '',
            status: this.container.querySelector('#statusFilter')?.value || '',
            fromDate: this.container.querySelector('#fromDateFilter')?.value || '',
            toDate: this.container.querySelector('#toDateFilter')?.value || '',
            orderCount: this.container.querySelector('#orderCountFilter')?.value || ''
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
        this.container.querySelector('#roleFilter').value = '';
        this.container.querySelector('#statusFilter').value = '';
        this.container.querySelector('#fromDateFilter').value = '';
        this.container.querySelector('#toDateFilter').value = '';
        this.container.querySelector('#orderCountFilter').value = '';

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
                    item.name.toLowerCase().includes(searchLower) ||
                    item.email.toLowerCase().includes(searchLower) ||
                    (item.phone && item.phone.toLowerCase().includes(searchLower));

                if (!matchesSearch) return false;
            }

            // Role filter
            if (this.filters.role && item.role !== this.filters.role) {
                return false;
            }

            // Status filter
            if (this.filters.status && item.status !== this.filters.status) {
                return false;
            }

            // Date range filter
            if (this.filters.fromDate || this.filters.toDate) {
                const userDate = new Date(item.createdAt);
                if (this.filters.fromDate) {
                    const fromDate = new Date(this.filters.fromDate);
                    if (userDate < fromDate) return false;
                }
                if (this.filters.toDate) {
                    const toDate = new Date(this.filters.toDate);
                    toDate.setHours(23, 59, 59, 999);
                    if (userDate > toDate) return false;
                }
            }

            // Order count filter
            if (this.filters.orderCount) {
                const orderCount = item.orderCount || 0;
                const [min, max] = this.filters.orderCount.split('-').map(v => v ? parseInt(v) : null);

                if (min !== null && orderCount < min) return false;
                if (max !== null && orderCount > max) return false;
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
            if (this.sortColumn === 'name') {
                aVal = a.name || '';
                bVal = b.name || '';
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
        const tbody = this.container.querySelector('#userTableBody');
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
        const avatarHtml = item.avatar
            ? `<img src="${item.avatar}" alt="${item.name}" class="user-avatar">`
            : `<div class="user-avatar-placeholder">${item.name.charAt(0).toUpperCase()}</div>`;

        const roleClass = {
            'admin': 'role-admin',
            'manager': 'role-manager',
            'user': 'role-user',
            'guest': 'role-guest'
        }[item.role] || 'role-user';

        const roleText = {
            'admin': 'Quản trị viên',
            'manager': 'Quản lý',
            'user': 'Người dùng',
            'guest': 'Khách'
        }[item.role] || 'Người dùng';

        const statusClass = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'pending': 'status-pending',
            'banned': 'status-banned'
        }[item.status] || 'status-inactive';

        const statusText = {
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động',
            'pending': 'Chờ xác nhận',
            'banned': 'Bị cấm'
        }[item.status] || 'Không xác định';

        const lastLoginText = item.lastLogin
            ? AdminUtils.formatRelativeTime(item.lastLogin)
            : 'Chưa đăng nhập';

        const orderCountText = item.orderCount > 0
            ? `${item.orderCount} đơn hàng`
            : 'Chưa có đơn hàng';

        return `
            <tr data-id="${item.id}">
                <td>
                    <input type="checkbox" class="item-checkbox" value="${item.id}">
                </td>
                <td>${avatarHtml}</td>
                <td>
                    <div class="user-info">
                        <a href="#" class="user-name" data-action="view" data-id="${item.id}">
                            ${AdminUtils.escapeHtml(item.name)}
                        </a>
                        <div class="user-email">${AdminUtils.escapeHtml(item.email)}</div>
                        ${item.phone ? `<div class="user-phone">${AdminUtils.escapeHtml(item.phone)}</div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="user-role ${roleClass}">${roleText}</span>
                </td>
                <td>
                    <div class="user-status">
                        <span class="status-indicator ${statusClass}"></span>
                        <span>${statusText}</span>
                    </div>
                </td>
                <td>
                    <div class="user-activity">
                        <div class="last-login">${lastLoginText}</div>
                        ${item.loginCount ? `<div class="login-count">${item.loginCount} lần đăng nhập</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="order-count">${orderCountText}</div>
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
                        ${item.status === 'active' ? `
                            <button class="action-btn action-btn-ban" data-action="ban" data-id="${item.id}" title="Cấm tài khoản">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : `
                            <button class="action-btn action-btn-activate" data-action="activate" data-id="${item.id}" title="Kích hoạt tài khoản">
                                <i class="fas fa-check"></i>
                            </button>
                        `}
                        <button class="action-btn action-btn-reset" data-action="reset-password" data-id="${item.id}" title="Đặt lại mật khẩu">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="action-btn action-btn-delete" data-action="delete" data-id="${item.id}" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
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
        const newStatus = prompt('Nhập trạng thái mới (active, inactive, banned):');
        if (!newStatus) return;

        try {
            AdminUtils.showLoading(this.container);
            await adminAjax.bulkUpdateUsers(Array.from(this.selectedItems), { status: newStatus });
            adminAjax.showNotification('Cập nhật người dùng thành công', 'success');
            this.selectedItems.clear();
            this.loadData();
        } catch (error) {
            adminAjax.showNotification('Lỗi khi cập nhật người dùng', 'error');
        } finally {
            AdminUtils.hideLoading(this.container);
        }
    }

    /**
     * Handle add user
     */
    handleAddUser() {
        // This would typically open a modal or navigate to add user page
        window.location.href = '/admin/users/add';
    }

    /**
     * Handle export
     */
    handleExport() {
        adminAjax.exportUsers('excel', this.filters);
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
    module.exports = UserTable;
}
