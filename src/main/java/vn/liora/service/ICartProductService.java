package vn.liora.service;

import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.CartProduct;

import java.util.List;

public interface ICartProductService {
    CartProductResponse addProductToCart(Long idCart, CartProductCreationRequest request);
    CartProductResponse updateCartProduct(Long idCart, Long idCartProduct, CartProductUpdateRequest request);
    void removeProductInCart(Long idCart, Long idCartProduct);
    void removeProductsInCart(Long idCart, List<Long> idCartProduct);
    CartProductResponse getCartProductById(Long idCartProduct);
    List<CartProductResponse> getSelectedProducts(Long idCart);

}
