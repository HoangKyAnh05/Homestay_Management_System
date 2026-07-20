package com.homestayManagement.homestayManagement.service;

public class CustomerAiUnavailableException extends RuntimeException {
    public CustomerAiUnavailableException(String message) {
        super(message);
    }

    public CustomerAiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
