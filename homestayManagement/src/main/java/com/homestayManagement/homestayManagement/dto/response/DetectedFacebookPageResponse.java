package com.homestayManagement.homestayManagement.dto.response;

public class DetectedFacebookPageResponse {
    private String id;
    private String name;
    private String category;
    private String pageUrl;
    private String accessToken;
    private String type; // "PAGE" or "USER"

    public DetectedFacebookPageResponse() {}

    public DetectedFacebookPageResponse(String id, String name, String category, String pageUrl, String accessToken, String type) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.pageUrl = pageUrl;
        this.accessToken = accessToken;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
