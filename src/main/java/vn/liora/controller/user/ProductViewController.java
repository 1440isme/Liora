package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.service.ICategoryService;

@Controller
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductViewController {

    private final ICategoryService categoryService;

    @GetMapping("/view/category/{categoryId}")
    public String getProductsByCategory(@PathVariable Long categoryId, Model model) {
        try {
            // Get category info for display
            var category = categoryService.findById(categoryId);
            model.addAttribute("categoryId", categoryId);
            model.addAttribute("categoryName", category.getName());
            model.addAttribute("categoryDescription", "Sản phẩm trong danh mục " + category.getName());
            
            return "user/categories/category-products";
        } catch (Exception e) {
            // If category not found, redirect to home
            return "redirect:/";
        }
    }
}
