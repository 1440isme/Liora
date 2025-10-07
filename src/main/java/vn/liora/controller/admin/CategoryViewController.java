package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.service.ICategoryService;

@Controller
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class CategoryViewController {

    private final ICategoryService categoryService;

    @GetMapping
    public String listCategories() {
        return "admin/categories/list";
    }

    @GetMapping("/add")
    public String addCategory() {
        return "admin/categories/add";
    }

    @GetMapping("/{id}/edit")
    public String editCategory(@PathVariable Long id, Model model) {
        try {
            CategoryResponse category = categoryService.findById(id);
            model.addAttribute("category", category);
            return "admin/categories/edit";
        } catch (Exception e) {
            return "redirect:/admin/categories?error=notfound";
        }
    }
}
