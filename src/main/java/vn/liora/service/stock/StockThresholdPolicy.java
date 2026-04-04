package vn.liora.service.stock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StockThresholdPolicy {

    private final int lowStockThreshold;

    public StockThresholdPolicy(@Value("${stock.notification.low-threshold:10}") int lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public StockEventType determineEvent(Integer oldStock, Integer newStock) {
        int previous = normalize(oldStock);
        int current = normalize(newStock);

        if (previous == 0 && current > 0) {
            return StockEventType.RESTOCKED;
        }

        if (previous > 0 && current == 0) {
            return StockEventType.OUT_OF_STOCK;
        }

        if (previous > lowStockThreshold && current > 0 && current <= lowStockThreshold) {
            return StockEventType.LOW_STOCK;
        }

        return null;
    }

    private int normalize(Integer stock) {
        return stock == null ? 0 : Math.max(stock, 0);
    }
}
