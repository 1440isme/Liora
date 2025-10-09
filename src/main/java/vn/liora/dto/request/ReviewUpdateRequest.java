package vn.liora.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewUpdateRequest {
    
//    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
//    @Size(max = 100, message = "VALIDATION_TITLE_TOO_LONG")
//    private String title;
    
    @Size(max = 255, message = "VALIDATION_CONTENT_TOO_LONG")
    private String content;
    
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    @Min(value = 1, message = "VALIDATION_RATING_MIN")
    @Max(value = 5, message = "VALIDATION_RATING_MAX")
    private Integer rating;
    
    private Boolean anonymous;
}