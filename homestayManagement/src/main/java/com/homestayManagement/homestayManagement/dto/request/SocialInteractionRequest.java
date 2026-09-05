package com.homestayManagement.homestayManagement.dto.request;

public class SocialInteractionRequest {
    private String interactionType; // "LIKE", "COMMENT", "SHARE"
    private String actorName;
    private String commentText;

    public SocialInteractionRequest() {}

    public SocialInteractionRequest(String interactionType, String actorName, String commentText) {
        this.interactionType = interactionType;
        this.actorName = actorName;
        this.commentText = commentText;
    }

    public String getInteractionType() {
        return interactionType;
    }

    public void setInteractionType(String interactionType) {
        this.interactionType = interactionType;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }
}
