package com.p2pskill.service;

import com.p2pskill.dao.MatchDAO;
import com.p2pskill.dao.RequestDAO;
import com.p2pskill.model.Match;
import com.p2pskill.model.RequestStatus;
import com.p2pskill.model.SkillExchangeRequest;
import com.p2pskill.util.InputValidator;
import com.p2pskill.util.SessionManager;

import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

/**
 * Service class for handling skill exchange requests and match creation.
 */
public class RequestService {

    private final RequestDAO requestDAO;
    private final MatchDAO matchDAO;
    private final Queue<SkillExchangeRequest> pendingRequestQueue = new LinkedList<>();

    public RequestService() {
        this.requestDAO = new RequestDAO();
        this.matchDAO = new MatchDAO();
    }

    public RequestService(RequestDAO requestDAO, MatchDAO matchDAO) {
        this.requestDAO = requestDAO;
        this.matchDAO = matchDAO;
    }

    public SkillExchangeRequest sendRequest(int receiverId, String message) {
        return sendRequest(SessionManager.getInstance().getCurrentUserId(), receiverId, message);
    }

    public SkillExchangeRequest sendRequest(int senderId, int receiverId, String message) {
        if (senderId == receiverId) {
            throw new IllegalArgumentException("You cannot send an exchange request to yourself.");
        }

        String msgError = InputValidator.validateRequestMessage(message);
        if (msgError != null) {
            throw new IllegalArgumentException(msgError);
        }

        if (requestDAO.pendingRequestExists(senderId, receiverId)) {
            throw new IllegalArgumentException("You already have a pending request to this student. Wait for their response.");
        }

        SkillExchangeRequest request = new SkillExchangeRequest(
            senderId, receiverId,
            (message != null && !message.isBlank()) ? message.trim() : null
        );
        requestDAO.insertRequest(request);
        return request;
    }

    public Match acceptRequest(int requestId, double matchScore) {
        return acceptRequest(requestId, SessionManager.getInstance().getCurrentUserId(), matchScore);
    }

    public Match acceptRequest(int requestId, int currentUserId, double matchScore) {
        SkillExchangeRequest request = requestDAO.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found."));

        if (request.getReceiverId() != currentUserId) {
            throw new IllegalArgumentException("You are not authorised to accept this request.");
        }

        if (!request.isPending()) {
            throw new IllegalStateException("This request has already been " + request.getStatus().name().toLowerCase() + ".");
        }

        requestDAO.updateStatus(requestId, RequestStatus.ACCEPTED);
        request.setStatus(RequestStatus.ACCEPTED);

        Match match = new Match(
            requestId,
            request.getSenderId(),
            request.getReceiverId(),
            matchScore
        );
        matchDAO.insertMatch(match);
        return match;
    }

    public void rejectRequest(int requestId) {
        rejectRequest(requestId, SessionManager.getInstance().getCurrentUserId());
    }

    public void rejectRequest(int requestId, int currentUserId) {
        SkillExchangeRequest request = requestDAO.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found."));

        if (request.getReceiverId() != currentUserId) {
            throw new IllegalArgumentException("You are not authorised to reject this request.");
        }

        if (!request.isPending()) {
            throw new IllegalStateException("This request has already been resolved.");
        }

        requestDAO.updateStatus(requestId, RequestStatus.REJECTED);
        request.setStatus(RequestStatus.REJECTED);
    }

    public List<SkillExchangeRequest> getIncomingRequests() {
        return getIncomingRequests(SessionManager.getInstance().getCurrentUserId());
    }

    public List<SkillExchangeRequest> getIncomingRequests(int myId) {
        List<SkillExchangeRequest> incoming = requestDAO.findByReceiver(myId);
        pendingRequestQueue.clear();
        for (SkillExchangeRequest req : incoming) {
            if (req.isPending()) {
                pendingRequestQueue.offer(req);
            }
        }
        return incoming;
    }

    public List<SkillExchangeRequest> getOutgoingRequests() {
        return getOutgoingRequests(SessionManager.getInstance().getCurrentUserId());
    }

    public List<SkillExchangeRequest> getOutgoingRequests(int myId) {
        return requestDAO.findBySender(myId);
    }

    public int getPendingRequestCount() {
        int myId = SessionManager.getInstance().getCurrentUserId();
        return requestDAO.countPendingByReceiver(myId);
    }

    public Queue<SkillExchangeRequest> getPendingRequestQueue() {
        return pendingRequestQueue;
    }

    public boolean hasExistingRequest(int peerId) {
        return hasExistingRequest(SessionManager.getInstance().getCurrentUserId(), peerId);
    }

    public boolean hasExistingRequest(int myId, int peerId) {
        return requestDAO.hasActiveOrPendingRequest(myId, peerId);
    }
}
