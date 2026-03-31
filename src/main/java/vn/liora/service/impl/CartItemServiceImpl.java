package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.CartItemCreationRequest;
import vn.liora.dto.request.CartItemUpdateRequest;
import vn.liora.dto.response.CartItemResponse;
import vn.liora.entity.Cart;
import vn.liora.entity.CartItem;
import vn.liora.entity.Image;
import vn.liora.entity.Product;
import vn.liora.enums.ProductItemStatus;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartItemMapper;
import vn.liora.repository.CartItemRepository;
import vn.liora.repository.ProductItemRepository;
import vn.liora.repository.CartRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.service.ICartItemService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartItemServiceImpl implements ICartItemService {

    CartItemRepository cartItemRepository;
    CartRepository cartRepository;
    ProductRepository productRepository;
    ProductItemRepository productItemRepository;
    CartItemMapper cartItemMapper;

    @Override
    @Transactional
    public CartItemResponse addItemToCart(Long idCart, CartItemCreationRequest request) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        Product product = productRepository.findById(request.getIdProduct())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Optional<CartItem> existing = cartItemRepository.findByCart_IdCartAndProduct_ProductId(idCart, request.getIdProduct());
        CartItem cartItem;
        if (existing.isPresent()) {
            cartItem = existing.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
            cartItem.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            cartItem.setChoose(true);
        } else {
            cartItem = cartItemMapper.toCartItem(request);
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setChoose(false);
            cartItem.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }
        cartItem = cartItemRepository.save(cartItem);
        hydrateProductStock(cartItem.getProduct());
        return cartItemMapper.toCartItemResponse(cartItem);
    }

    @Override
    public CartItemResponse updateCartItem(Long idCart, Long idCartItem, CartItemUpdateRequest request) {
        cartRepository.findById(idCart).orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        CartItem cartItem = cartItemRepository.findByIdCartItem(idCartItem)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));

        cartItemMapper.updateCartItem(cartItem, request);
        if (request.getChoose() != null) {
            cartItem.setChoose(request.getChoose());
        }
        if (request.getQuantity() != null) {
            Product product = cartItem.getProduct();
            cartItem.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }
        cartItem = cartItemRepository.save(cartItem);

        hydrateProductStock(cartItem.getProduct());
        CartItemResponse response = cartItemMapper.toCartItemResponse(cartItem);
        response.setMainImageUrl(getMainImageUrl(cartItem.getProduct()));
        return response;
    }

    @Override
    @Transactional
    public void removeItemsInCart(Long idCart, List<Long> idCartItem) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        List<CartItem> cartItems;
        if (idCartItem == null) {
            cartItems = cartItemRepository.findByCartAndChooseTrue(cart);
        } else {
            cartItems = cartItemRepository.findAllById(idCartItem);
        }
        if (cartItems.isEmpty()) {
            return;
        }
        cartItemRepository.deleteAll(cartItems);
    }

    @Override
    public CartItemResponse getCartItemById(Long idCartItem) {
        CartItem cartItem = cartItemRepository.findByIdCartItem(idCartItem)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));
        hydrateProductStock(cartItem.getProduct());
        CartItemResponse response = cartItemMapper.toCartItemResponse(cartItem);
        response.setMainImageUrl(getMainImageUrl(cartItem.getProduct()));
        return response;
    }

    @Override
    public List<CartItemResponse> getSelectedItems(Long idCart) {
        Cart cart = cartRepository.findById(idCart).orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        List<CartItem> selectedItems = cartItemRepository.findByCartAndChooseTrueWithProduct(cart);
        return selectedItems.stream()
                .filter(cartItem -> {
                    Product product = cartItem.getProduct();
                    return product != null && Boolean.TRUE.equals(product.getAvailable()) && Boolean.TRUE.equals(product.getIsActive());
                })
                .map(cartItem -> {
                    hydrateProductStock(cartItem.getProduct());
                    CartItemResponse response = cartItemMapper.toCartItemResponse(cartItem);
                    response.setMainImageUrl(getMainImageUrl(cartItem.getProduct()));
                    return response;
                })
                .toList();
    }

    @Override
    public BigDecimal getSelectedItemsTotal(Long cartId) {
        Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        List<CartItem> cartItems = cartItemRepository.findByCartAndChooseTrue(cart);
        return cartItems.stream()
                .filter(cartItem -> {
                    Product product = cartItem.getProduct();
                    return product != null && Boolean.TRUE.equals(product.getAvailable()) && Boolean.TRUE.equals(product.getIsActive());
                })
                .map(CartItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public double getCartTotal(Long cartId) {
        BigDecimal total = this.getSelectedItemsTotal(cartId);
        return total != null ? total.doubleValue() : 0.0;
    }

    @Override
    public int getCartItemCount(Long cartId) {
        Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        Long count = cartItemRepository.getCartItemCount(cart);
        return count != null ? count.intValue() : 0;
    }

    @Override
    public List<CartItemResponse> getAllItemsInCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        List<CartItem> cartItems = cartItemRepository.findByCartWithProduct(cart);
        return cartItems.stream()
                .map(cartItem -> {
                    hydrateProductStock(cartItem.getProduct());
                    CartItemResponse response = cartItemMapper.toCartItemResponse(cartItem);
                    response.setMainImageUrl(getMainImageUrl(cartItem.getProduct()));
                    return response;
                })
                .toList();
    }

    private String getMainImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return "/uploads/products/placeholder.jpg";
        }
        return product.getImages().stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsMain()))
                .findFirst()
                .map(Image::getImageUrl)
                .orElse(product.getImages().get(0).getImageUrl());
    }

    private void hydrateProductStock(Product product) {
        if (product == null || product.getProductId() == null) {
            return;
        }
        long stock = productItemRepository.countByProductProductIdAndStatus(
                product.getProductId(),
                ProductItemStatus.IN_STOCK);
        product.setStock((int) stock);
    }
}
