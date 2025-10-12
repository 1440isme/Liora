package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartProductMapper;
import vn.liora.repository.CartProductRepository;
import vn.liora.repository.CartRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartProductService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartProductServiceImpl implements ICartProductService {

    CartProductRepository cartProductRepository;
    CartRepository cartRepository;
    ProductRepository productRepository;
    UserRepository userRepository;
    CartProductMapper cartProductMapper;

    @Override
    @Transactional
    public CartProductResponse addProductToCart(Long idCart, CartProductCreationRequest request) {

        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        Product product = productRepository.findById(request.getIdProduct())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        // Kiểm tra nếu sản phẩm đã tồn tại trong giỏ hàng
        Optional<CartProduct> existing = cartProductRepository.findByCart_IdCartAndProduct_ProductId(idCart, request.getIdProduct());
        CartProduct cartProduct ;

        if (existing.isPresent()) {
            cartProduct = existing.get();
            cartProduct.setQuantity(cartProduct.getQuantity() + request.getQuantity());
            cartProduct.setTotalPrice(product.getPrice()
                    .multiply(BigDecimal.valueOf(cartProduct.getQuantity())));
        } else {
            // Nếu chưa có thì tạo mới
            cartProduct = cartProductMapper.toCartProduct(request);
            cartProduct.setCart(cart);
            cartProduct.setProduct(product);
            cartProduct.setChoose(false);
            cartProduct.setTotalPrice(product.getPrice()
                    .multiply(BigDecimal.valueOf(cartProduct.getQuantity())));
        }
        cartProduct = cartProductRepository.save(cartProduct);

        return cartProductMapper.toCartProductResponse(cartProduct);


    }

    @Override
    public CartProductResponse updateCartProduct(Long idCart, Long idCartProduct, CartProductUpdateRequest request) {
            Cart cart = cartRepository.findById(idCart)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
            CartProduct cartProduct = cartProductRepository.findByIdCartProduct(idCartProduct)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));
            cartProductMapper.updateCartProduct(cartProduct, request);
            Product product = cartProduct.getProduct();
        cartProduct.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartProduct.getQuantity())));
        cartProduct = cartProductRepository.save(cartProduct);
            return cartProductMapper.toCartProductResponse(cartProduct);
        }

    @Override
    @Transactional
    public void removeProductInCart(Long idCart, Long idCartProduct) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        CartProduct cartProduct = cartProductRepository.findByIdCartProduct(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));
        cartProductRepository.delete(cartProduct);
    }

    @Override
    @Transactional

    public void removeProductsInCart(Long idCart, List<Long> idCartProduct) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        List<CartProduct> cartProducts = cartProductRepository.findByCartAndChooseTrue(cart);
        if (cartProducts.isEmpty()) {
            throw new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND);
        }
        cartProductRepository.deleteAll(cartProducts);


    }

    @Override
    @Transactional

    public CartProductResponse getCartProductById(Long idCartProduct) {
        CartProduct cartProduct = cartProductRepository.findByIdCartProduct(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));
        return cartProductMapper.toCartProductResponse(cartProduct);
    }

    @Override
    public List<CartProductResponse> getSelectedProducts(Long idCart) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        // Lấy các sản phẩm đã chọn trong giỏ
        List<CartProduct> selectedProducts = cartProductRepository.findByCartAndChooseTrue(cart);

        // Map sang DTO
        return cartProductMapper.toCartProductResponseList(selectedProducts);
    }

    @Override
    public double getCartTotal(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        List<CartProduct> cartProducts = cartProductRepository.findByCart(cart);
        return cartProducts.stream()
                .mapToDouble(cp -> cp.getTotalPrice().doubleValue())
                .sum();
    }

    @Override
    public int getCartItemCount(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        List<CartProduct> cartProducts = cartProductRepository.findByCart(cart);
        return cartProducts.stream()
                .mapToInt(CartProduct::getQuantity)
                .sum();
    }

    @Override
    public List<CartProductResponse> getAllProductsInCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        List<CartProduct> cartProducts = cartProductRepository.findByCart(cart);
        return cartProductMapper.toCartProductResponseList(cartProducts);
    }
}
