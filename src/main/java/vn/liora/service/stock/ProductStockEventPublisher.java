package vn.liora.service.stock;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import vn.liora.entity.Product;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ProductStockEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final StockThresholdPolicy stockThresholdPolicy;

    public void publishIfNeeded(Product product, Integer oldStock, Integer newStock) {
        if (product == null || product.getProductId() == null) {
            return;
        }

        StockEventType eventType = stockThresholdPolicy.determineEvent(oldStock, newStock);
        if (eventType == null) {
            return;
        }

        applicationEventPublisher.publishEvent(new ProductStockChangedEvent(
                product.getProductId(),
                product.getName(),
                oldStock,
                newStock,
                eventType,
                LocalDateTime.now()));
    }
}
