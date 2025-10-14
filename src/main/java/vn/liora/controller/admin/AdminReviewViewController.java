package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewViewController {

    @GetMapping
    public String reviewsPage(Model model) {
        model.addAttribute("pageTitle", "Quản lý đánh giá");
        return "admin/reviews/list";
    }
}