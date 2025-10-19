package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.liora.service.PasswordResetService;

@Controller
@RequestMapping("/reset-password")
@RequiredArgsConstructor
@Slf4j
public class PasswordResetViewController {

    private final PasswordResetService passwordResetService;

    @GetMapping
    public String resetPasswordPage(Model model) {
        // Không cần token từ URL, user sẽ nhập token từ email
        return "user/auth/reset-password";
    }
}
