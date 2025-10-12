package vn.liora.enums;

public enum FooterLinkType {
    INTERNAL, // Link đến trang nội bộ (static pages)
    EXTERNAL, // Link đến trang bên ngoài
    CATEGORY, // Link đến danh mục sản phẩm lớn (click chuyển trang)
    PARENT_CATEGORY, // Danh mục cha (click xổ ra danh mục con)
    PRODUCT, // Link đến sản phẩm
    PAGE // Link đến trang tĩnh
}
