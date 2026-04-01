package vn.liora.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DiscountSchemaMigration implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        Integer columnExists = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Discounts'
                  AND COLUMN_NAME = 'DiscountType'
                """, Integer.class);

        if (columnExists != null && columnExists > 0) {
            return;
        }

        log.info("DiscountType column is missing in Discounts. Applying compatibility migration.");
        jdbcTemplate.execute("""
                ALTER TABLE Discounts
                ADD COLUMN DiscountType VARCHAR(50) NOT NULL DEFAULT 'PERCENTAGE'
                """);

        jdbcTemplate.update("""
                UPDATE Discounts
                SET DiscountType = 'PERCENTAGE'
                WHERE DiscountType IS NULL
                """);
        log.info("DiscountType compatibility migration completed.");
    }
}
