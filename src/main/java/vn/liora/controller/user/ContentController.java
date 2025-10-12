package vn.liora.controller.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.BannerResponse;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.entity.*;
import vn.liora.service.BannerService;
import vn.liora.service.StaticPageService;
import vn.liora.service.FooterService;
import vn.liora.service.HeaderNavigationService;

import java.util.ArrayList;
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

    @Autowired
    private FooterService footerService;

    @Autowired
    private HeaderNavigationService headerNavigationService;

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

    // API lấy thông tin footer
    @GetMapping("/api/footer")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getFooterContent() {
        Map<String, Object> footerContent = new HashMap<>();

        try {
            Footer footer = footerService.getActiveFooter();
            System.out.println("Footer found: " + (footer != null ? "Yes" : "No"));
            if (footer != null) {
                System.out.println("Footer ID: " + footer.getId());
                System.out.println("Brand Name: " + footer.getBrandName());

                // Tạo Map cho footer thay vì trả về object trực tiếp
                Map<String, Object> footerData = new HashMap<>();
                footerData.put("id", footer.getId());
                footerData.put("brandName", footer.getBrandName());
                footerData.put("brandDescription", footer.getBrandDescription());
                footerData.put("isActive", footer.getIsActive());

                footerContent.put("footer", footerData);

                // Tạo DTO cho columns để tránh circular reference
                List<Map<String, Object>> columnsData = new ArrayList<>();
                List<FooterColumn> columns = footerService.getActiveColumns(footer.getId());
                System.out.println("Columns count: " + columns.size());
                for (FooterColumn column : columns) {
                    Map<String, Object> columnData = new HashMap<>();
                    columnData.put("id", column.getId());
                    columnData.put("title", column.getTitle());
                    columnData.put("sortOrder", column.getColumnOrder());

                    // Tạo DTO cho items
                    List<Map<String, Object>> itemsData = new ArrayList<>();
                    if (column.getItems() != null) {
                        for (FooterItem item : column.getItems()) {
                            Map<String, Object> itemData = new HashMap<>();
                            itemData.put("id", item.getId());
                            itemData.put("title", item.getTitle());
                            itemData.put("url", item.getUrl());
                            itemData.put("linkType", item.getLinkType().toString());
                            itemData.put("sortOrder", item.getItemOrder());
                            itemsData.add(itemData);
                        }
                    }
                    columnData.put("items", itemsData);
                    columnsData.add(columnData);
                }
                footerContent.put("columns", columnsData);

                // Tạo DTO cho social links
                List<Map<String, Object>> socialLinksData = new ArrayList<>();
                List<FooterSocialLink> socialLinks = footerService.getActiveSocialLinks(footer.getId());
                System.out.println("Social links count: " + socialLinks.size());
                for (FooterSocialLink link : socialLinks) {
                    Map<String, Object> linkData = new HashMap<>();
                    linkData.put("id", link.getId());
                    linkData.put("platform", link.getPlatform());
                    linkData.put("url", link.getUrl());
                    linkData.put("iconClass", link.getIconClass());
                    linkData.put("sortOrder", link.getDisplayOrder());
                    socialLinksData.add(linkData);
                }
                footerContent.put("socialLinks", socialLinksData);

            }
            return ResponseEntity.ok(footerContent);
        } catch (Exception e) {
            System.err.println("Error loading footer content: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(footerContent);
        }
    }

    // API lấy thông tin header tầng dưới
    @GetMapping("/api/header-bottom")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getHeaderNavigationContent() {
        Map<String, Object> headerContent = new HashMap<>();

        try {
            List<HeaderNavigationItem> navigationItems = headerNavigationService.getAllActiveItems();
            headerContent.put("navigationItems", navigationItems);
            return ResponseEntity.ok(headerContent);
        } catch (Exception e) {
            System.err.println("Error loading header navigation content: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(headerContent);
        }
    }

    @GetMapping("/api/header-bottom/sub-items/{parentId}")
    @ResponseBody
    public ResponseEntity<List<HeaderNavigationItem>> getSubItems(@PathVariable Long parentId) {
        try {
            List<HeaderNavigationItem> subItems = headerNavigationService.getSubItemsByParentId(parentId);
            return ResponseEntity.ok(subItems);
        } catch (Exception e) {
            System.err.println("Error loading sub-items: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
