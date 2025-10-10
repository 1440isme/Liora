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

    // Orders - Chỉ giữ lại mapping cho orders
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
