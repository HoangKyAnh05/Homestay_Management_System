package com.homestayManagement.homestayManagement.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ScannedCommentItemRequest {
    private String id;
    private String authorName;
    private String authorAvatar;
    private String message;
    private String publishedAt;
    private String timeText;
    private Long timestampMs;
    private String postUrl;
    private String videoTitle;
    private Boolean replied;

    public ScannedCommentItemRequest() {}

    public String getTimeText() {
        return timeText != null ? timeText : publishedAt;
    }

    public void setTimeText(String timeText) {
        this.timeText = timeText;
        if (this.publishedAt == null) {
            this.publishedAt = timeText;
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorAvatar() {
        return authorAvatar;
    }

    public void setAuthorAvatar(String authorAvatar) {
        this.authorAvatar = authorAvatar;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(String publishedAt) {
        this.publishedAt = publishedAt;
    }

    public Long getTimestampMs() {
        return timestampMs;
    }

    public void setTimestampMs(Long timestampMs) {
        this.timestampMs = timestampMs;
    }

    private String commentUrl;
    private String videoUrl;

    public String getCommentUrl() {
        return commentUrl != null ? commentUrl : postUrl;
    }

    public void setCommentUrl(String commentUrl) {
        this.commentUrl = commentUrl;
        if (this.postUrl == null) {
            this.postUrl = commentUrl;
        }
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
        if (this.postUrl == null) {
            this.postUrl = videoUrl;
        }
    }

    public String getPostUrl() {
        if (postUrl != null && !postUrl.trim().isEmpty()) return postUrl.trim();
        if (commentUrl != null && !commentUrl.trim().isEmpty()) return commentUrl.trim();
        if (videoUrl != null && !videoUrl.trim().isEmpty()) return videoUrl.trim();
        return "";
    }

    public void setPostUrl(String postUrl) {
        this.postUrl = postUrl;
    }

    public String getVideoTitle() {
        return videoTitle;
    }

    public void setVideoTitle(String videoTitle) {
        this.videoTitle = videoTitle;
    }

    public Boolean getReplied() {
        return replied;
    }

    public void setReplied(Boolean replied) {
        this.replied = replied;
    }
}
