package com.homestayManagement.homestayManagement.security;

public class OtpLockedException extends RuntimeException {
    public OtpLockedException(String message) {
        super(message);
    }
}
