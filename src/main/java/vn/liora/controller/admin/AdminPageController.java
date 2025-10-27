package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.service.IBrandService;
import vn.liora.service.ICategoryService;
import vn.liora.service.IDashboardService;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminPageController {

    private final ICategoryService categoryService;
    private final IBrandService brandService;
    private final IDashboardService dashboardService;

    private void addCurrentUserToModel(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            model.addAttribute("currentUser", authentication.getName());
        }
    }

    @GetMapping("/revenue")
    @ResponseBody
    public Map<String, Double> getRevenueData(
            @RequestParam String type, // time/category/brand
            @RequestParam(required = false, defaultValue = "day") String groupType, // chỉ dùng cho "time"
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        return switch (type.toLowerCase()) {
            case "category" -> dashboardService.getRevenueByCategory(startDate, endDate);
            case "brand" -> dashboardService.getRevenueByBrand(startDate, endDate);
            default -> dashboardService.getRevenueByTime(groupType, startDate, endDate);
        };
    }
    
    // API lấy dữ liệu khách hàng mới theo tháng
    @GetMapping("/customers/new-by-month")
    @ResponseBody
    public Map<String, Long> getNewCustomersByMonth() {
        return dashboardService.getNewCustomersByMonth();
    }

    // Dashboard
    @GetMapping({ "", "/", "/dashboard" })
    public String dashboard(Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("totalRevenue", dashboardService.getTotalRevenue());
        model.addAttribute("totalOrders", dashboardService.getTotalOrders());
        model.addAttribute("totalProducts", dashboardService.getTotalProducts());
        model.addAttribute("totalCustomers", dashboardService.getTotalCustomers());
        model.addAttribute("pendingOrders", dashboardService.getPendingOrders());
        model.addAttribute("lowStockProducts", dashboardService.getLowStockProducts());
        model.addAttribute("todayRevenue", dashboardService.getTodayRevenue());
        model.addAttribute("conversionRate", dashboardService.getConversionRate());

        model.addAttribute("recentOrders", dashboardService.getRecentOrders(5));
        model.addAttribute("topProducts", dashboardService.getTopProducts(5));

        return "admin/dashboard/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "admin/auth/login";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        addCurrentUserToModel(model);
        return "admin/auth/profile";
    }

    // Products
    @GetMapping("/products")
    public String productsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/products/list";
    }

    @GetMapping("/products/add")
    public String productsAdd(Model model) {
        addCurrentUserToModel(model);
        // Thêm dữ liệu categories và brands vào model
        model.addAttribute("categories", categoryService.findActiveCategories());
        model.addAttribute("brands", brandService.findActiveBrands());
        return "admin/products/add";
    }

    @GetMapping("/products/{id}")
    public String productsDetail(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/products/detail";
    }

    @GetMapping("/products/{id}/edit")
    public String productsEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/products/edit";
    }

    // Categories - Removed duplicate mappings (handled by CategoryViewController)

    // Brands
    @GetMapping("/brands")
    public String brandsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/brands/list";
    }

    @GetMapping("/brands/add")
    public String brandsAdd(Model model) {
        addCurrentUserToModel(model);
        return "admin/brands/add";
    }

    @GetMapping("/brands/{id}/edit")
    public String brandsEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/brands/edit";
    }

    // Orders
    @GetMapping("/orders")
    public String ordersList(Model model) {
        addCurrentUserToModel(model);
        return "admin/orders/list";
    }

    @GetMapping("/orders/detail/{id}")
    public String ordersDetail(@PathVariable Long id, Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("orderId", id);
        return "admin/orders/detail";
    }

    // Users
    @GetMapping("/users")
    @PreAuthorize("hasAuthority('user.view')")
    public String usersList(Model model) {
        addCurrentUserToModel(model);
        return "admin/users/list";
    }

    @GetMapping("/users/add")
    @PreAuthorize("hasAuthority('user.create')")
    public String usersAdd(Model model) {
        addCurrentUserToModel(model);
        return "admin/users/add";
    }

    @GetMapping("/users/{id}/edit")
    @PreAuthorize("hasAuthority('user.update')")
    public String usersEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("userId", id);
        return "admin/users/edit";
    }

    // Roles
    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('role.view')")
    public String rolesList(Model model) {
        addCurrentUserToModel(model);
        return "admin/roles/list";
    }

    @GetMapping("/roles/manage")
    @PreAuthorize("hasAuthority('role.manage_permissions')")
    public String rolesManage(Model model) {
        addCurrentUserToModel(model);
        return "admin/roles/manage";
    }

    // Permissions
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('permission.view')")
    public String permissionsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/permissions/list";
    }

    @GetMapping("/permissions/manage")
    @PreAuthorize("hasAuthority('permission.manage')")
    public String permissionsManage(Model model) {
        addCurrentUserToModel(model);
        return "admin/permissions/manage";
    }

    //Analytics
    @GetMapping("/analytics")
    public String analytics(Model model) {
        addCurrentUserToModel(model);
        model.addAttribute("totalRevenue", dashboardService.getTotalRevenue());
        model.addAttribute("totalOrders", dashboardService.getTotalOrders());
        model.addAttribute("totalProducts", dashboardService.getTotalProducts());
        model.addAttribute("totalBrands", brandService.count());
        model.addAttribute("totalCustomers", dashboardService.getTotalCustomers());
        model.addAttribute("returningCustomers", dashboardService.getReturningCustomers());
        model.addAttribute("newCustomersThisMonth", dashboardService.getNewCustomersThisMonth());

        model.addAttribute("recentOrders", dashboardService.getRecentOrders(15));
        model.addAttribute("topProducts", dashboardService.getTopProducts(15));
        model.addAttribute("lowStockProducts", dashboardService.getLowStockProductsList(10));
        model.addAttribute("topCustomers", dashboardService.getTopCustomers(10));
        return "admin/analytics/index";
    }
}
