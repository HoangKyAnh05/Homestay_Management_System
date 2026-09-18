package com.homestayManagement.homestayManagement.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SyncScannedCommentsRequest {
    private String platform; // FACEBOOK, TIKTOK, YOUTUBE
    private String channel;
    private String pageTitle;
    private String pageUrl;
    private String videoTitle;
    private Long channelId;
    private List<ScannedCommentItemRequest> comments = new ArrayList<>();

    public SyncScannedCommentsRequest() {}

    public String getChannel() {
        return channel != null ? channel : platform;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getPageTitle() {
        return pageTitle;
    }

    public void setPageTitle(String pageTitle) {
        this.pageTitle = pageTitle;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
    }

    public String getVideoTitle() {
        return videoTitle;
    }

    public void setVideoTitle(String videoTitle) {
        this.videoTitle = videoTitle;
    }

    public Long getChannelId() {
        return channelId;
    }

    public void setChannelId(Long channelId) {
        this.channelId = channelId;
    }

    public List<ScannedCommentItemRequest> getComments() {
        return comments;
    }

    public void setComments(List<ScannedCommentItemRequest> comments) {
        this.comments = comments != null ? comments : new ArrayList<>();
    }
}
