package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.CartProduct;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CartProductMapper {

    @Mapping(target = "idCartProduct", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "choose", ignore = true)
    CartProduct toCartProduct(CartProductCreationRequest request);

    @Mapping(target = "idCart", source = "cart.idCart")
    @Mapping(target = "idProduct", source = "product.productId")
    CartProductResponse toCartProductResponse(CartProduct cartProduct);
    List<CartProductResponse> toCartProductResponseList(List<CartProduct> cartProducts);

    void updateCartProduct(@MappingTarget CartProduct cartProduct, CartProductUpdateRequest request);
}
