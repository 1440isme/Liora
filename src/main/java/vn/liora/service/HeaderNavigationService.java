package vn.liora.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.entity.Category;
import vn.liora.entity.HeaderNavigationItem;
import vn.liora.entity.StaticPage;
import vn.liora.repository.CategoryRepository;
import vn.liora.repository.HeaderNavigationItemRepository;
import vn.liora.repository.StaticPageRepository;

import java.util.*;

@Service
public class HeaderNavigationService {

    @Autowired
    private HeaderNavigationItemRepository headerNavigationItemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StaticPageRepository staticPageRepository;

    public List<HeaderNavigationItem> getAllActiveItems() {
        return headerNavigationItemRepository.findByIsActiveTrueAndParentItemIdIsNullOrderByItemOrder();
    }

    public List<HeaderNavigationItem> getSubItemsByParentId(Long parentId) {
        return headerNavigationItemRepository.findByIsActiveTrueAndParentItemIdOrderByItemOrder(parentId);
    }

    @Transactional
    public void saveOrUpdateNavigationItems(List<HeaderNavigationItem> navigationItems) {

        // Clear all existing items
        headerNavigationItemRepository.deleteAll();

        // Handle null case
        if (navigationItems == null) {
            return;
        }

        // First pass: Save all parent items (items without parentItemId)
        Map<Integer, Long> parentIdMap = new HashMap<>();
        for (int i = 0; i < navigationItems.size(); i++) {
            HeaderNavigationItem item = navigationItems.get(i);

            // Skip empty items
            if (item.getTitle() == null || item.getTitle().trim().isEmpty()) {
                continue;
            }

            // Set category reference if it's a category link
            if (item.getCategory() != null && item.getCategory().getCategoryId() != null) {
                Optional<Category> category = categoryRepository.findById(item.getCategory().getCategoryId());
                category.ifPresent(item::setCategory);
            }

            // Set static page reference if it's an internal link
            if (item.getStaticPage() != null && item.getStaticPage().getId() != null) {
                Optional<StaticPage> staticPage = staticPageRepository.findById(item.getStaticPage().getId());
                staticPage.ifPresent(item::setStaticPage);
            }

            // Save parent item
            HeaderNavigationItem savedItem = headerNavigationItemRepository.save(item);
            parentIdMap.put(i, savedItem.getId());
        }

        // Second pass: Save sub items with correct parent references
        for (int i = 0; i < navigationItems.size(); i++) {
            HeaderNavigationItem parentItem = navigationItems.get(i);
            if (parentItem.getSubItems() != null && !parentItem.getSubItems().isEmpty()) {
                Long parentId = parentIdMap.get(i);

                if (parentId != null) {
                    for (HeaderNavigationItem subItem : parentItem.getSubItems()) {
                        // Skip empty sub-items
                        if (subItem.getTitle() == null || subItem.getTitle().trim().isEmpty()) {
                            continue;
                        }

                        subItem.setParentItemId(parentId);
                        subItem.setIsCategoryParent(false);

                        // Set category reference if it's a category link
                        if (subItem.getCategory() != null && subItem.getCategory().getCategoryId() != null) {
                            Optional<Category> category = categoryRepository
                                    .findById(subItem.getCategory().getCategoryId());
                            category.ifPresent(subItem::setCategory);
                        }

                        // Set static page reference if it's an internal link
                        if (subItem.getStaticPage() != null && subItem.getStaticPage().getId() != null) {
                            Optional<StaticPage> staticPage = staticPageRepository
                                    .findById(subItem.getStaticPage().getId());
                            staticPage.ifPresent(subItem::setStaticPage);
                        }

                        headerNavigationItemRepository.save(subItem);
                    }
                }
            }
        }
    }

    @Transactional
    public void initializeDefaultNavigation() {
        // Clear existing items
        headerNavigationItemRepository.deleteAll();

        // Create default navigation items
        HeaderNavigationItem homeItem = new HeaderNavigationItem();
        homeItem.setTitle("Trang chủ");
        homeItem.setUrl("/");
        homeItem.setLinkType(vn.liora.enums.FooterLinkType.INTERNAL);
        homeItem.setItemOrder(1);
        homeItem.setIsCategoryParent(false);
        homeItem.setIsActive(true);
        headerNavigationItemRepository.save(homeItem);

        HeaderNavigationItem aboutItem = new HeaderNavigationItem();
        aboutItem.setTitle("Giới thiệu");
        aboutItem.setUrl("/about");
        aboutItem.setLinkType(vn.liora.enums.FooterLinkType.INTERNAL);
        aboutItem.setItemOrder(2);
        aboutItem.setIsCategoryParent(false);
        aboutItem.setIsActive(true);
        headerNavigationItemRepository.save(aboutItem);

        HeaderNavigationItem contactItem = new HeaderNavigationItem();
        contactItem.setTitle("Liên hệ");
        contactItem.setUrl("/contact");
        contactItem.setLinkType(vn.liora.enums.FooterLinkType.INTERNAL);
        contactItem.setItemOrder(3);
        contactItem.setIsCategoryParent(false);
        contactItem.setIsActive(true);
        headerNavigationItemRepository.save(contactItem);
    }
}