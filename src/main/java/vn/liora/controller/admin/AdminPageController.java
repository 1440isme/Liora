package vn.liora.controller.admin;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminPageController {

    private void addCurrentUserToModel(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            model.addAttribute("currentUser", authentication.getName());
        }
    }

    // Dashboard
    @GetMapping({ "", "/", "/dashboard" })
    public String dashboard(Model model) {
        addCurrentUserToModel(model);
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
        return "admin/products/add";
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

    @GetMapping("/orders/{id}")
    public String ordersDetail(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/orders/detail";
    }

    // Users
    @GetMapping("/users")
    public String usersList(Model model) {
        addCurrentUserToModel(model);
        return "admin/users/list";
    }

    @GetMapping("/users/add")
    public String usersAdd(Model model) {
        addCurrentUserToModel(model);
        return "admin/users/add";
    }

    @GetMapping("/users/{id}/edit")
    public String usersEdit(@PathVariable("id") Long id, Model model) {
        addCurrentUserToModel(model);
        return "admin/users/edit";
    }

    // Permissions
    @GetMapping("/permissions")
    public String permissionsList(Model model) {
        addCurrentUserToModel(model);
        return "admin/permissions/list";
    }

    @GetMapping("/permissions/manage")
    public String permissionsManage(Model model) {
        addCurrentUserToModel(model);
        return "admin/permissions/manage";
    }

    // Roles
    @GetMapping("/roles")
    public String rolesList(Model model) {
        addCurrentUserToModel(model);
        return "admin/roles/list";
    }

    @GetMapping("/roles/manage")
    public String rolesManage(Model model) {
        addCurrentUserToModel(model);
        return "admin/roles/manage";
    }
}
