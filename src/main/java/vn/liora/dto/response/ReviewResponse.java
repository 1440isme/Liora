package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewResponse {
    private Long reviewId;
    private String content;
    private Integer rating;
    private Boolean anonymous;
    private Boolean isVisible;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdate;
    
    // User info
    private Long userId;
    private String userFirstname;
    private String userLastname;
    private String userAvatar;
    private String userDisplayName; // Computed field for display
    
    // Product info
    private Long productId;
    private String productName;
    
    // Order info
    private Long orderProductId;
    
    // Helper method to get display name
    public String getUserDisplayName() {
        if (Boolean.TRUE.equals(anonymous)) {
            return "Anonymous User";
        }
        if (userFirstname != null && userLastname != null) {
            return userFirstname + " " + userLastname;
        }
        return "User";
    }
}