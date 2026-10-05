package com.p2pskill.model;

import java.time.LocalDateTime;

/**
 * Represents a direct chat message between two students in an accepted skill-exchange match.
 *
 * Encapsulation:
 *  - messageId, matchId, senderId, senderName, content, sentAt, isRead
 */
public class ChatMessage {

    private int           messageId;
    private int           matchId;
    private int           senderId;
    private String        senderName;   // Populated for UI display
    private String        content;
    private LocalDateTime sentAt;
    private boolean       isRead;

    public ChatMessage() {}

    public ChatMessage(int matchId, int senderId, String content) {
        this.matchId  = matchId;
        this.senderId = senderId;
        this.content  = content;
        this.sentAt   = LocalDateTime.now();
        this.isRead   = false;
    }

    public ChatMessage(int messageId, int matchId, int senderId, String senderName,
                       String content, LocalDateTime sentAt, boolean isRead) {
        this.messageId  = messageId;
        this.matchId    = matchId;
        this.senderId   = senderId;
        this.senderName = senderName;
        this.content    = content;
        this.sentAt     = sentAt;
        this.isRead     = isRead;
    }

    // ── Getters and Setters ────────────────────────────────────

    public int getMessageId() {
        return messageId;
    }

    public void setMessageId(int messageId) {
        this.messageId = messageId;
    }

    public int getMatchId() {
        return matchId;
    }

    public void setMatchId(int matchId) {
        this.matchId = matchId;
    }

    public int getSenderId() {
        return senderId;
    }

    public void setSenderId(int senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    @Override
    public String toString() {
        return "ChatMessage{" +
                "messageId=" + messageId +
                ", matchId=" + matchId +
                ", senderId=" + senderId +
                ", senderName='" + senderName + '\'' +
                ", content='" + content + '\'' +
                ", sentAt=" + sentAt +
                ", isRead=" + isRead +
                '}';
    }
}
