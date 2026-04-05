package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.response.OrderItemResponse;
import vn.liora.entity.OrderItem;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {
    @Mapping(target = "idOrderItem", source = "idOrderItem")
    @Mapping(target = "idOrder", source = "order.idOrder")
    @Mapping(target = "idProduct", source = "productItem.product.productId")
    @Mapping(target = "quantity", constant = "1")
    @Mapping(target = "totalPrice", source = "productItem.product.price")
    @Mapping(target = "productName", source = "productItem.product.name")
    @Mapping(target = "productDescription", source = "productItem.product.description")
    @Mapping(target = "productPrice", source = "productItem.product.price")
    @Mapping(target = "categoryName", source = "productItem.product.category.name")
    @Mapping(target = "brandName", source = "productItem.product.brand.name")
    @Mapping(target = "brandId", source = "productItem.product.brand.brandId")
    @Mapping(target = "mainImageUrl", ignore = true)
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);

    List<OrderItemResponse> toOrderItemResponseList(List<OrderItem> orderItems);
}
