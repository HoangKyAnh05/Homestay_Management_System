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

        Integer paymentBookingDetailColumn = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'payments'
                  and column_name = 'booking_detail_id'
                """, Integer.class);
        if (paymentBookingDetailColumn != null && paymentBookingDetailColumn == 0) {
            jdbcTemplate.execute("""
                    alter table payments
                    add column booking_detail_id bigint null
                    """);
            LOGGER.info("Added payments.booking_detail_id for room-specific checkout payments");
        }

        Integer paymentHoldColumn = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'bookings'
                  and column_name = 'payment_hold_expires_at'
                """, Integer.class);
        if (paymentHoldColumn != null && paymentHoldColumn == 0) {
            jdbcTemplate.execute("""
                    alter table bookings
                    add column payment_hold_expires_at datetime null
                    """);
            LOGGER.info("Added bookings.payment_hold_expires_at for temporary payment holds");
        }

        addColumnIfMissing("bookings", "voucher_id", "alter table bookings add column voucher_id bigint null");
        addColumnIfMissing("bookings", "voucher_code", "alter table bookings add column voucher_code varchar(20) null");
        addColumnIfMissing("bookings", "voucher_discount_type", "alter table bookings add column voucher_discount_type varchar(20) null");
        addColumnIfMissing("bookings", "voucher_discount_value", "alter table bookings add column voucher_discount_value decimal(10,2) null");
        addColumnIfMissing("bookings", "room_charge_before_discount", "alter table bookings add column room_charge_before_discount decimal(10,2) not null default 0");
        addColumnIfMissing("bookings", "room_discount_amount", "alter table bookings add column room_discount_amount decimal(10,2) not null default 0");
        addColumnIfMissing("bookings", "customer_confirmed", "alter table bookings add column customer_confirmed bit not null default 0");
        addColumnIfMissing("bookings", "customer_feedback", "alter table bookings add column customer_feedback varchar(1000) null");
        addColumnIfMissing("bookings", "customer_feedback_at", "alter table bookings add column customer_feedback_at datetime null");
        addColumnIfMissing("booking_details", "allocated_discount", "alter table booking_details add column allocated_discount decimal(10,2) not null default 0");
        addColumnIfMissing("invoices", "room_discount_amount", "alter table invoices add column room_discount_amount decimal(10,2) not null default 0");
    }

    private void addColumnIfMissing(String tableName, String columnName, String ddl) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = database()
                  and table_name = ?
                  and column_name = ?
                """, Integer.class, tableName, columnName);
        if (count != null && count == 0) {
            jdbcTemplate.execute(ddl);
            LOGGER.info("Added {}.{}", tableName, columnName);
        }
    }
}
