package com.homestayManagement.homestayManagement.dto.request;

public class DetectYouTubeTokenRequest {
    private String token;
    private String channelQuery;

    public DetectYouTubeTokenRequest() {}

    public DetectYouTubeTokenRequest(String token, String channelQuery) {
        this.token = token;
        this.channelQuery = channelQuery;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getChannelQuery() {
        return channelQuery;
    }

    public void setChannelQuery(String channelQuery) {
        this.channelQuery = channelQuery;
    }
}
