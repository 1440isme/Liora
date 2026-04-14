package vn.liora.service.stock;

import java.time.LocalDateTime;

public record ProductStockChangedEvent(
        Long productId,
        String productName,
        Integer oldStock,
        Integer newStock,
        StockEventType eventType,
        LocalDateTime changedAt) {
}
