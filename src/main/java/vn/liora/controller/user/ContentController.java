package vn.liora.controller.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.BannerResponse;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.service.BannerService;
import vn.liora.service.StaticPageService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/content")
public class ContentController {

    @Autowired
    private BannerService bannerService;

    @Autowired
    private StaticPageService staticPageService;

    // Trang hiển thị static page theo slug
    @GetMapping("/page/{slug}")
    public String viewStaticPage(@PathVariable String slug, Model model) {
        try {
            StaticPageResponse staticPage = staticPageService.getStaticPageBySlug(slug);
            model.addAttribute("staticPage", staticPage);
            return "user/static-page";
        } catch (Exception e) {
            return "error/404";
        }
    }

    // API lấy danh sách banner active
    @GetMapping("/api/banners")
    @ResponseBody
    public ResponseEntity<List<BannerResponse>> getActiveBanners() {
        List<BannerResponse> banners = bannerService.getActiveBanners();
        return ResponseEntity.ok(banners);
    }

    // API lấy static page theo slug
    @GetMapping("/api/page/{slug}")
    @ResponseBody
    public ResponseEntity<StaticPageResponse> getStaticPageBySlug(@PathVariable String slug) {
        try {
            StaticPageResponse staticPage = staticPageService.getStaticPageBySlug(slug);
            return ResponseEntity.ok(staticPage);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API lấy danh sách static page active
    @GetMapping("/api/pages")
    @ResponseBody
    public ResponseEntity<List<StaticPageResponse>> getActiveStaticPages() {
        List<StaticPageResponse> staticPages = staticPageService.getActiveStaticPages();
        return ResponseEntity.ok(staticPages);
    }

    // API tìm kiếm static page
    @GetMapping("/api/search")
    @ResponseBody
    public ResponseEntity<List<StaticPageResponse>> searchStaticPages(@RequestParam String keyword) {
        List<StaticPageResponse> staticPages = staticPageService.searchStaticPagesByKeyword(keyword);
        return ResponseEntity.ok(staticPages);
    }

    // API lấy thông tin trang chủ (banner + static pages)
    @GetMapping("/api/home")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getHomeContent() {
        Map<String, Object> homeContent = new HashMap<>();

        // Lấy banner active
        List<BannerResponse> banners = bannerService.getActiveBanners();
        homeContent.put("banners", banners);

        // Lấy static pages active
        List<StaticPageResponse> staticPages = staticPageService.getActiveStaticPages();
        homeContent.put("staticPages", staticPages);

        return ResponseEntity.ok(homeContent);
    }
}
