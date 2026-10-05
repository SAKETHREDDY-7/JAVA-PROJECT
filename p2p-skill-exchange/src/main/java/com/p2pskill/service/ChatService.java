package com.p2pskill.service;

import com.p2pskill.dao.ChatMessageDAO;
import com.p2pskill.model.ChatMessage;

import java.util.List;

/**
 * Service class for managing student chat messages within accepted matches.
 * Enforces business logic and participant authorization.
 */
public class ChatService {

    private final ChatMessageDAO chatMessageDAO;

    public ChatService() {
        this.chatMessageDAO = new ChatMessageDAO();
    }

    public ChatService(ChatMessageDAO chatMessageDAO) {
        this.chatMessageDAO = chatMessageDAO;
    }

    /**
     * Sends a chat message within an accepted match.
     *
     * @param matchId  ID of the active match
     * @param senderId ID of the student sending the message
     * @param content  Text content of the message
     * @return the saved ChatMessage object
     */
    public ChatMessage sendMessage(int matchId, int senderId, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty.");
        }

        String trimmed = content.trim();
        if (trimmed.length() > 2000) {
            throw new IllegalArgumentException("Message exceeds maximum allowed length of 2000 characters.");
        }

        if (!chatMessageDAO.isUserInMatch(matchId, senderId)) {
            throw new IllegalStateException("Unauthorized: You are not an active participant in this study partnership.");
        }

        return chatMessageDAO.insertMessage(matchId, senderId, trimmed);
    }

    /**
     * Retrieves all chat messages for a match, ensuring the requester is authorized.
     *
     * @param matchId   ID of the active match
     * @param studentId ID of the student requesting the conversation
     * @return List of ChatMessages
     */
    public List<ChatMessage> getMessages(int matchId, int studentId) {
        if (!chatMessageDAO.isUserInMatch(matchId, studentId)) {
            throw new IllegalStateException("Unauthorized: You are not an active participant in this study partnership.");
        }

        return chatMessageDAO.getMessagesByMatch(matchId);
    }
}
