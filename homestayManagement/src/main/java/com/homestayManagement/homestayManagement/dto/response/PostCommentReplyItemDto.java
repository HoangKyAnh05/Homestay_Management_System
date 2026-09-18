package com.homestayManagement.homestayManagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCommentReplyItemDto {
    private String id;
    private String authorName;
    private String authorAvatar;
    private String message;
    private String publishedAt;
    private Boolean isAdmin;
}
