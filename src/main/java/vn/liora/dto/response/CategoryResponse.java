package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class CategoryResponse {
    private Long categoryId;
    private String name;
    private String icon;
    private Long parentCategoryId;
    private Boolean isParent;
}
