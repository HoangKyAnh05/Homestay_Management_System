package com.homestayManagement.homestayManagement.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PostCommentDto {
    private String id;
    private String authorName;
    private String authorAvatarUrl;
    private String message;
    private String createdTime;
    private Long likeCount;
    private String postUrl;
    private String videoTitle;
    private Long timestampMs;
    private java.util.List<PostCommentReplyItemDto> replies = new java.util.ArrayList<>();

    public PostCommentDto() {}

    public PostCommentDto(String id, String authorName, String authorAvatarUrl, String message, String createdTime, Long likeCount) {
        this.id = id;
        this.authorName = authorName;
        this.authorAvatarUrl = authorAvatarUrl;
        this.message = message;
        this.createdTime = createdTime;
        this.likeCount = likeCount;
        this.replies = new java.util.ArrayList<>();
    }

    public PostCommentDto(String id, String authorName, String authorAvatarUrl, String message, String createdTime, Long likeCount, java.util.List<PostCommentReplyItemDto> replies) {
        this.id = id;
        this.authorName = authorName;
        this.authorAvatarUrl = authorAvatarUrl;
        this.message = message;
        this.createdTime = createdTime;
        this.likeCount = likeCount;
        this.replies = replies != null ? replies : new java.util.ArrayList<>();
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

    public String getAuthorAvatarUrl() {
        return authorAvatarUrl;
    }

    public void setAuthorAvatarUrl(String authorAvatarUrl) {
        this.authorAvatarUrl = authorAvatarUrl;
    }

    @JsonProperty("authorAvatar")
    public String getAuthorAvatar() {
        return authorAvatarUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(String createdTime) {
        this.createdTime = createdTime;
    }

    @JsonProperty("publishedAt")
    public String getPublishedAt() {
        return createdTime;
    }

    public Long getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Long likeCount) {
        this.likeCount = likeCount;
    }

    public String getPostUrl() {
        return postUrl;
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

    public Long getTimestampMs() {
        return timestampMs;
    }

    public void setTimestampMs(Long timestampMs) {
        this.timestampMs = timestampMs;
    }

    public java.util.List<PostCommentReplyItemDto> getReplies() {
        return replies != null ? replies : new java.util.ArrayList<>();
    }

    public void setReplies(java.util.List<PostCommentReplyItemDto> replies) {
        this.replies = replies != null ? replies : new java.util.ArrayList<>();
    }
}
