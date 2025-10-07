/**
 * Product Table Component
 * Handles product table functionality, filtering, sorting, and actions
 */

class ProductTable {
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
            <div class="product-table-container">
                <div class="product-table-header">
                    <h3 class="table-title">Danh sách sản phẩm</h3>
                    <div class="table-actions">
                        <button class="btn-admin btn-admin-primary" id="addProductBtn">
                            <i class="fas fa-plus"></i> Thêm sản phẩm
                        </button>
                        <button class="btn-admin btn-admin-secondary" id="exportBtn">
                            <i class="fas fa-download"></i> Xuất Excel
                        </button>
                        <button class="btn-admin btn-admin-danger" id="bulkDeleteBtn" style="display: none;">
                            <i class="fas fa-trash"></i> Xóa đã chọn
                        </button>
                    </div>
                </div>
                
                <div class="product-filters" id="productFilters">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label class="filter-label">Tìm kiếm</label>
                            <input type="text" class="filter-control" id="searchInput" placeholder="Tìm theo tên, SKU...">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Danh mục</label>
                            <select class="filter-control" id="categoryFilter">
                                <option value="">Tất cả danh mục</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Thương hiệu</label>
                            <select class="filter-control" id="brandFilter">
                                <option value="">Tất cả thương hiệu</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Trạng thái</label>
                            <select class="filter-control" id="statusFilter">
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                                <option value="draft">Bản nháp</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Kho hàng</label>
                            <select class="filter-control" id="stockFilter">
                                <option value="">Tất cả</option>
                                <option value="in_stock">Còn hàng</option>
                                <option value="low_stock">Sắp hết hàng</option>
                                <option value="out_of_stock">Hết hàng</option>
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
                    <table class="admin-table product-table" id="productTable">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="selectAllCheckbox">
                                </th>
                                <th data-sort="image">Hình ảnh</th>
                                <th data-sort="name">Tên sản phẩm</th>
                                <th data-sort="sku">SKU</th>
                                <th data-sort="category">Danh mục</th>
                                <th data-sort="brand">Thương hiệu</th>
                                <th data-sort="price">Giá</th>
                                <th data-sort="stock">Tồn kho</th>
                                <th data-sort="status">Trạng thái</th>
                                <th data-sort="createdAt">Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="productTableBody">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div class="pagination-container" id="paginationContainer">
                    <div class="pagination-info">
                        Hiển thị <span id="showingFrom">0</span> - <span id="showingTo">0</span> 
                        trong tổng số <span id="totalItems">0</span> sản phẩm
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
        const bulkDeleteBtn = this.container.querySelector('#bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.handleBulkDelete();
            });
        }

        // Add product button
        const addProductBtn = this.container.querySelector('#addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.handleAddProduct();
            });
        }

        // Export button
        const exportBtn = this.container.querySelector('#exportBtn');
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

            const response = await adminAjax.getProducts(params);
            this.data = response.content || response.data || [];
            this.totalItems = response.totalElements || response.total || 0;
            this.totalPages = response.totalPages || Math.ceil(this.totalItems / this.pageSize);

            this.filteredData = [...this.data];
            this.renderTable();
            this.loadFilterOptions();

        } catch (error) {
            console.error('Error loading products:', error);
            adminAjax.showNotification('Lỗi khi tải danh sách sản phẩm', 'error');
        } finally {
            AdminUtils.hideLoading(this.container);
        }
    }

    /**
     * Load filter options (categories, brands)
     */
    async loadFilterOptions() {
        try {
            // Load categories
            const categories = await adminAjax.getCategories();
            const categoryFilter = this.container.querySelector('#categoryFilter');
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' +
                    categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }

            // Load brands
            const brands = await adminAjax.getBrands();
            const brandFilter = this.container.querySelector('#brandFilter');
            if (brandFilter) {
                brandFilter.innerHTML = '<option value="">Tất cả thương hiệu</option>' +
                    brands.map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    /**
     * Update filters from form inputs
     */
    updateFilters() {
        this.filters = {
            categoryId: this.container.querySelector('#categoryFilter')?.value || '',
            brandId: this.container.querySelector('#brandFilter')?.value || '',
            status: this.container.querySelector('#statusFilter')?.value || '',
            stock: this.container.querySelector('#stockFilter')?.value || ''
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
        this.container.querySelector('#categoryFilter').value = '';
        this.container.querySelector('#brandFilter').value = '';
        this.container.querySelector('#statusFilter').value = '';
        this.container.querySelector('#stockFilter').value = '';

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
                    item.sku.toLowerCase().includes(searchLower) ||
                    (item.description && item.description.toLowerCase().includes(searchLower));

                if (!matchesSearch) return false;
            }

            // Category filter
            if (this.filters.categoryId && item.categoryId !== parseInt(this.filters.categoryId)) {
                return false;
            }

            // Brand filter
            if (this.filters.brandId && item.brandId !== parseInt(this.filters.brandId)) {
                return false;
            }

            // Status filter
            if (this.filters.status && item.status !== this.filters.status) {
                return false;
            }

            // Stock filter
            if (this.filters.stock) {
                const stock = item.stock || 0;
                switch (this.filters.stock) {
                    case 'in_stock':
                        if (stock <= 0) return false;
                        break;
                    case 'low_stock':
                        if (stock > 0 && stock >= 10) return false;
                        break;
                    case 'out_of_stock':
                        if (stock > 0) return false;
                        break;
                }
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
            if (this.sortColumn === 'category') {
                aVal = a.category?.name || '';
                bVal = b.category?.name || '';
            } else if (this.sortColumn === 'brand') {
                aVal = a.brand?.name || '';
                bVal = b.brand?.name || '';
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
        const tbody = this.container.querySelector('#productTableBody');
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
        const imageHtml = item.images && item.images.length > 0
            ? `<img src="${item.images[0].url}" alt="${item.name}" class="product-image">`
            : `<div class="product-image-placeholder"><i class="fas fa-image"></i></div>`;

        const statusClass = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'draft': 'status-draft'
        }[item.status] || 'status-inactive';

        const statusText = {
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động',
            'draft': 'Bản nháp'
        }[item.status] || 'Không xác định';

        const stockClass = item.stock > 10 ? 'stock-in' : item.stock > 0 ? 'stock-low' : 'stock-out';
        const stockText = item.stock > 0 ? `${item.stock} sản phẩm` : 'Hết hàng';

        return `
            <tr data-id="${item.id}">
                <td>
                    <input type="checkbox" class="item-checkbox" value="${item.id}">
                </td>
                <td>${imageHtml}</td>
                <td>
                    <div class="product-info">
                        <a href="#" class="product-name" data-action="view" data-id="${item.id}">${AdminUtils.escapeHtml(item.name)}</a>
                        <div class="product-sku">SKU: ${AdminUtils.escapeHtml(item.sku)}</div>
                    </div>
                </td>
                <td>${AdminUtils.escapeHtml(item.sku)}</td>
                <td>${item.category?.name || 'N/A'}</td>
                <td>${item.brand?.name || 'N/A'}</td>
                <td>
                    <div class="product-price">${AdminUtils.formatCurrency(item.price)}</div>
                    ${item.originalPrice && item.originalPrice > item.price ?
                `<div class="product-price-old">${AdminUtils.formatCurrency(item.originalPrice)}</div>` : ''}
                </td>
                <td>
                    <div class="stock-info">
                        <span class="stock-indicator ${stockClass}"></span>
                        <span>${stockText}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
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
        const bulkDeleteBtn = this.container.querySelector('#bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.style.display = this.selectedItems.size > 0 ? 'inline-block' : 'none';
        }
    }

    /**
     * Handle bulk delete
     */
    async handleBulkDelete() {
        if (this.selectedItems.size === 0) return;

        const confirmed = await AdminUtils.confirm(
            `Bạn có chắc chắn muốn xóa ${this.selectedItems.size} sản phẩm đã chọn?`,
            'Xác nhận xóa'
        );

        if (confirmed) {
            try {
                AdminUtils.showLoading(this.container);
                await adminAjax.bulkDeleteProducts(Array.from(this.selectedItems));
                adminAjax.showNotification('Xóa sản phẩm thành công', 'success');
                this.selectedItems.clear();
                this.loadData();
            } catch (error) {
                adminAjax.showNotification('Lỗi khi xóa sản phẩm', 'error');
            } finally {
                AdminUtils.hideLoading(this.container);
            }
        }
    }

    /**
     * Handle add product
     */
    handleAddProduct() {
        // This would typically open a modal or navigate to add product page
        window.location.href = '/admin/products/add';
    }

    /**
     * Handle export
     */
    handleExport() {
        adminAjax.exportProducts('excel', this.filters);
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
    module.exports = ProductTable;
}
