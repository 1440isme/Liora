package vn.liora.controller.user;

// removed unused import
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
// removed unused import
import org.springframework.web.bind.annotation.RequestMapping;

// removed unused import

@Controller
@RequestMapping({ "/", "/home" })
public class HomeController {

    // Dashboard
    @GetMapping()
    public String dashboard() {
        return "user/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "admin/auth/login";
    }

    @GetMapping("/info")
    public String info() {

        return "user/user/info";
    }
}
