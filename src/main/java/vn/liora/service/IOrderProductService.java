package vn.liora.service;

import vn.liora.dto.request.OrderProductCreationRequest;
import vn.liora.dto.request.OrderProductUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;

import java.util.List;

public interface IOrderProductService {
    OrderResponse createOrder();
    OrderProductResponse getOrderProductById(Long idOrderProduct);
    List<OrderProductResponse> getOrderProducts(Long idOrder);
    OrderProductResponse updateOrderProduct(Long idOrderProduct, OrderProductUpdateRequest request);

}
