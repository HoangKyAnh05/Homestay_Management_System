package com.homestayManagement.homestayManagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaMigration implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        String nullable = jdbcTemplate.queryForObject("""
                select is_nullable
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'invoices'
                  and column_name = 'employee_id'
                """, String.class);

        if ("NO".equalsIgnoreCase(nullable)) {
            jdbcTemplate.execute("alter table invoices modify column employee_id bigint null");
            LOGGER.info("Updated invoices.employee_id to allow online invoices without an employee");
        }

        Integer paymentPurposeColumn = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'payments'
                  and column_name = 'payment_purpose'
                """, Integer.class);
        if (paymentPurposeColumn != null && paymentPurposeColumn == 0) {
            jdbcTemplate.execute("""
                    alter table payments
                    add column payment_purpose varchar(20) not null default 'BOOKING'
                    """);
            LOGGER.info("Added payments.payment_purpose for booking and checkout payments");
        }
    }
}
