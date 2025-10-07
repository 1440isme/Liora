package vn.liora.service;

import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;

import java.util.List;

public interface ICartProductService {
    CartProductResponse addProductToCart(CartProductCreationRequest request);
    CartProductResponse updateCartProduct(Long idCartProduct, CartProductUpdateRequest request);
    void removeProductFromCart(Long idCartProduct);
    CartProductResponse getCartProductById(Long idCartProduct);
    List<CartProductResponse> getCartProducts(Long idCart);
    void clearCartProducts(Long idCart);
}
