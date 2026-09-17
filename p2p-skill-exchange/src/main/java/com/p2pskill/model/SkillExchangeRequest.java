package com.p2pskill.model;

import java.time.LocalDateTime;

/**
 * Represents a skill-exchange request from one student to another.
 *
 * Lifecycle:
 *   Created with status PENDING.
 *   Receiver can ACCEPT (triggers Match creation) or REJECT.
 *
 * OOP Concepts:
 *  - Encapsulation
 *  - Composition: holds sender/receiver Student objects (loaded on join)
 *  - Uses RequestStatus enum for type-safe status handling
 *
 * Members who use this class:
 *  - RequestDAO (DB persistence)
 *  - RequestService (business logic: validate, create, accept, reject)
 *  - RequestsController (UI display)
 *
 * Member 2 responsibility (model package).
 */
public class SkillExchangeRequest {

    private int           requestId;
    private int           senderId;
    private int           receiverId;
    private Student       sender;      // populated on join query
    private Student       receiver;   // populated on join query
    private String        message;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Constructors ────────────────────────────────────────

    public SkillExchangeRequest() {}

    /**
     * Constructor for creating a new request (before DB insert).
     * Status defaults to PENDING.
     */
    public SkillExchangeRequest(int senderId, int receiverId, String message) {
        this.senderId   = senderId;
        this.receiverId = receiverId;
        this.message    = message;
        this.status     = RequestStatus.PENDING;
    }

    /**
     * Full constructor for loading from DB.
     */
    public SkillExchangeRequest(int requestId, int senderId, int receiverId,
                                 String message, RequestStatus status,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.requestId  = requestId;
        this.senderId   = senderId;
        this.receiverId = receiverId;
        this.message    = message;
        this.status     = status;
        this.createdAt  = createdAt;
        this.updatedAt  = updatedAt;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getRequestId() { return requestId; }
    public void setRequestId(int requestId) { this.requestId = requestId; }

    public int getSenderId() { return senderId; }
    public void setSenderId(int senderId) { this.senderId = senderId; }

    public int getReceiverId() { return receiverId; }
    public void setReceiverId(int receiverId) { this.receiverId = receiverId; }

    public Student getSender() { return sender; }
    public void setSender(Student sender) {
        this.sender   = sender;
        this.senderId = sender != null ? sender.getStudentId() : 0;
    }

    public Student getReceiver() { return receiver; }
    public void setReceiver(Student receiver) {
        this.receiver   = receiver;
        this.receiverId = receiver != null ? receiver.getStudentId() : 0;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // ── Convenience methods ─────────────────────────────────

    public boolean isPending()  { return status == RequestStatus.PENDING;  }
    public boolean isAccepted() { return status == RequestStatus.ACCEPTED; }
    public boolean isRejected() { return status == RequestStatus.REJECTED; }

    /** Display name of the other party, given the current user's ID. */
    public String getOtherPartyName(int currentUserId) {
        if (currentUserId == senderId) {
            return receiver != null ? receiver.getFullName() : "Student #" + receiverId;
        }
        return sender != null ? sender.getFullName() : "Student #" + senderId;
    }

    // ── Object methods ──────────────────────────────────────

    @Override
    public String toString() {
        return "Request#" + requestId + " [" + senderId + "→" + receiverId
             + "] " + status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SkillExchangeRequest)) return false;
        SkillExchangeRequest other = (SkillExchangeRequest) o;
        return requestId == other.requestId;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(requestId);
    }
}
