package com.homestayManagement.homestayManagement.dto.response;

public class PostCommentDto {
    private String id;
    private String authorName;
    private String authorAvatarUrl;
    private String message;
    private String createdTime;
    private Long likeCount;

    public PostCommentDto() {}

    public PostCommentDto(String id, String authorName, String authorAvatarUrl, String message, String createdTime, Long likeCount) {
        this.id = id;
        this.authorName = authorName;
        this.authorAvatarUrl = authorAvatarUrl;
        this.message = message;
        this.createdTime = createdTime;
        this.likeCount = likeCount;
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

    public Long getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Long likeCount) {
        this.likeCount = likeCount;
    }
}
