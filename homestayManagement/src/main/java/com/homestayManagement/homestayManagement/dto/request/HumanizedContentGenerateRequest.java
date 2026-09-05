package com.homestayManagement.homestayManagement.dto.request;

public class HumanizedContentGenerateRequest {
    private Long roomId;
    private String theme; // SAN_MAY, PHONG_CHILL, AM_THUC, CAM_NANG, UU_DAI, CUSTOM
    private String tone;  // WARM, LOCAL_STORY, YOUTHFUL, LUXURY
    private String platform; // FACEBOOK, TIKTOK, INSTAGRAM, YOUTUBE
    private String customNotes;

    public HumanizedContentGenerateRequest() {}

    public HumanizedContentGenerateRequest(Long roomId, String theme, String tone, String platform, String customNotes) {
        this.roomId = roomId;
        this.theme = theme;
        this.tone = tone;
        this.platform = platform;
        this.customNotes = customNotes;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getTone() {
        return tone;
    }

    public void setTone(String tone) {
        this.tone = tone;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getCustomNotes() {
        return customNotes;
    }

    public void setCustomNotes(String customNotes) {
        this.customNotes = customNotes;
    }
}
