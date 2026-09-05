package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public class HumanizedContentResponse {
    private String title;
    private String caption;
    private String hashtags;
    private String callToAction;
    private String roomSummary;
    private List<String> suggestedImages;

    public HumanizedContentResponse() {}

    public HumanizedContentResponse(String title, String caption, String hashtags, String callToAction, String roomSummary, List<String> suggestedImages) {
        this.title = title;
        this.caption = caption;
        this.hashtags = hashtags;
        this.callToAction = callToAction;
        this.roomSummary = roomSummary;
        this.suggestedImages = suggestedImages;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getHashtags() {
        return hashtags;
    }

    public void setHashtags(String hashtags) {
        this.hashtags = hashtags;
    }

    public String getCallToAction() {
        return callToAction;
    }

    public void setCallToAction(String callToAction) {
        this.callToAction = callToAction;
    }

    public String getRoomSummary() {
        return roomSummary;
    }

    public void setRoomSummary(String roomSummary) {
        this.roomSummary = roomSummary;
    }

    public List<String> getSuggestedImages() {
        return suggestedImages;
    }

    public void setSuggestedImages(List<String> suggestedImages) {
        this.suggestedImages = suggestedImages;
    }
}
