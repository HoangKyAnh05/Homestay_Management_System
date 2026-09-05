package com.homestayManagement.homestayManagement.dto.request;

public class DetectFacebookTokenRequest {
    private String token;

    public DetectFacebookTokenRequest() {}

    public DetectFacebookTokenRequest(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
