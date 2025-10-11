package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
    private Long reviewId;
    private String content;
    private Integer rating;
    private Boolean anonymous;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdate;
    
    // User info
    private Long userId;
    private String userFirstname;
    private String userLastname;
    private String userAvatar;
    
    // Product info
    private Long productId;
    private String productName;
    
    // Order info
    private Long orderProductId;
}