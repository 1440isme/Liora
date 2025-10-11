package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.service.ICategoryService;

@Controller
@RequestMapping({ "/", "/home" })
@RequiredArgsConstructor
public class HomeController {

    private final ICategoryService categoryService;

    // Dashboard
    @GetMapping()
    public String dashboard(Model model) {
        // Thêm danh mục cha với cây con vào model để sử dụng trong header
        model.addAttribute("parentCategories", categoryService.getCategoryTree());
        return "user/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "admin/auth/login";
    }

    @GetMapping("/info")
    public String info(Model model) {
        // Thêm danh mục cha với cây con vào model để sử dụng trong header
        model.addAttribute("parentCategories", categoryService.getCategoryTree());
        return "user/user/info";
    }
}
