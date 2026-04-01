package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.CartItemCreationRequest;
import vn.liora.dto.request.CartItemUpdateRequest;
import vn.liora.dto.response.CartItemResponse;
import vn.liora.entity.CartItem;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CartItemMapper {

    @Mapping(target = "idCartItem", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "choose", ignore = true)
    CartItem toCartItem(CartItemCreationRequest request);

    @Mapping(target = "idCart", source = "cart.idCart")
    @Mapping(target = "idProduct", source = "product.productId")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productPrice", source = "product.price")
    @Mapping(target = "brandName", source = "product.brand.name")
    @Mapping(target = "brandId", source = "product.brand.brandId")
    @Mapping(target = "available", source = "product.available")
    @Mapping(target = "isActive", source = "product.isActive")
    @Mapping(target = "stock", source = "product.stock")
    @Mapping(target = "mainImageUrl", ignore = true)
    CartItemResponse toCartItemResponse(CartItem cartItem);

    List<CartItemResponse> toCartItemResponseList(List<CartItem> cartItems);

    @Mapping(target = "idCartItem", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "choose", ignore = true)
    void updateCartItem(@MappingTarget CartItem cartItem, CartItemUpdateRequest request);
}
