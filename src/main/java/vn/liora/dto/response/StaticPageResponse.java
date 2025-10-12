package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.entity.StaticPage;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageResponse {

    private Long id;
    private String title;
    private String slug;
    private String content;
    private String seoTitle;
    private String seoDescription;
    private String seoKeywords;
    private Boolean isActive;
    private Boolean isPublished;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor từ entity
    public StaticPageResponse(StaticPage staticPage) {
        this.id = staticPage.getId();
        this.title = staticPage.getTitle();
        this.slug = staticPage.getSlug();
        this.content = staticPage.getContent();
        this.seoTitle = staticPage.getSeoTitle();
        this.seoDescription = staticPage.getSeoDescription();
        this.seoKeywords = staticPage.getSeoKeywords();
        this.isActive = staticPage.getIsActive();
        this.isPublished = staticPage.getIsPublished();
        this.publishedAt = staticPage.getPublishedAt();
        this.createdAt = staticPage.getCreatedAt();
        this.updatedAt = staticPage.getUpdatedAt();
    }
}
