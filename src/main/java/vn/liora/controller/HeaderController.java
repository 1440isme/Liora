package vn.liora.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.service.ICategoryService;

@Controller
@RequestMapping("/api/header")
@RequiredArgsConstructor
public class HeaderController {

    private final ICategoryService categoryService;

    @GetMapping("/categories")
    public String getHeaderCategories(Model model) {
        // Lấy danh mục cha (isParent = true) và active
        model.addAttribute("parentCategories", categoryService.findActiveRootCategories());
        return "fragments/header-categories";
    }
}
