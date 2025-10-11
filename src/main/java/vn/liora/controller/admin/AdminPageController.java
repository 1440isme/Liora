package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.service.IBrandService;
import vn.liora.service.ICategoryService;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminPageController {

    private final ICategoryService categoryService;
    private final IBrandService brandService;

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
}
