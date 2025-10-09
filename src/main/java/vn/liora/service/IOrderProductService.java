package vn.liora.service;

import vn.liora.dto.request.OrderProductCreationRequest;
import vn.liora.dto.request.OrderProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.User;

import java.util.List;

public interface IOrderProductService {
   OrderProductResponse updateOrderProduct(Long idOrderProduct, OrderProductUpdateRequest request);


}
