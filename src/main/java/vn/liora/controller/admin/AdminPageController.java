package vn.liora.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminPageController {

    // Dashboard
    @GetMapping({ "", "/", "/dashboard" })
    public String dashboard() {
        return "admin/dashboard/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "admin/auth/login";
    }

    @GetMapping("/profile")
    public String profile() {
        return "admin/auth/profile";
    }

    // Products
    @GetMapping("/products")
    public String productsList() {
        return "admin/products/list";
    }

    @GetMapping("/products/add")
    public String productsAdd() {
        return "admin/products/add";
    }

    @GetMapping("/products/{id}/edit")
    public String productsEdit(@PathVariable("id") Long id) {
        return "admin/products/edit";
    }

    // Categories
    @GetMapping("/categories")
    public String categoriesList() {
        return "admin/categories/list";
    }

    @GetMapping("/categories/add")
    public String categoriesAdd() {
        return "admin/categories/add";
    }

    @GetMapping("/categories/{id}/edit")
    public String categoriesEdit(@PathVariable("id") Long id) {
        return "admin/categories/edit";
    }

    // Brands
    @GetMapping("/brands")
    public String brandsList() {
        return "admin/brands/list";
    }

    @GetMapping("/brands/add")
    public String brandsAdd() {
        return "admin/brands/add";
    }

    @GetMapping("/brands/{id}/edit")
    public String brandsEdit(@PathVariable("id") Long id) {
        return "admin/brands/edit";
    }

    // Orders
    @GetMapping("/orders")
    public String ordersList() {
        return "admin/orders/list";
    }

    @GetMapping("/orders/{id}")
    public String ordersDetail(@PathVariable("id") Long id) {
        return "admin/orders/detail";
    }

    // Users
    @GetMapping("/users")
    public String usersList() {
        return "admin/users/list";
    }

    @GetMapping("/users/add")
    public String usersAdd() {
        return "admin/users/add";
    }

    @GetMapping("/users/{id}/edit")
    public String usersEdit(@PathVariable("id") Long id) {
        return "admin/users/edit";
    }

    // Permissions
    @GetMapping("/permissions")
    public String permissionsList() {
        return "admin/permissions/list";
    }

    @GetMapping("/permissions/manage")
    public String permissionsManage() {
        return "admin/permissions/manage";
    }

    // Roles
    @GetMapping("/roles")
    public String rolesList() {
        return "admin/roles/list";
    }

    @GetMapping("/roles/manage")
    public String rolesManage() {
        return "admin/roles/manage";
    }
}
