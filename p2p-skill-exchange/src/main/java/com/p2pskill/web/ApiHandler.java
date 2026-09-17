package com.p2pskill.web;

import com.p2pskill.model.*;
import com.p2pskill.service.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Dispatches REST API calls from the web/mobile client to Java backend services.
 * Pure standard Java HttpHandler implementation.
 */
public class ApiHandler implements HttpHandler {

    private final AuthenticationService authService = new AuthenticationService();
    private final StudentService studentService = new StudentService();
    private final SkillService skillService = new SkillService();
    private final PeerRecommendationService peerService = new PeerRecommendationService();
    private final RequestService requestService = new RequestService();
    private final MatchService matchService = new MatchService();
    private final FeedbackService feedbackService = new FeedbackService();
    private final MatchingService matchingService = new MatchingService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        // Handle CORS Pre-flight requests
        if ("OPTIONS".equalsIgnoreCase(method)) {
            sendResponse(exchange, 204, "");
            return;
        }

        try {
            if (path.startsWith("/api/auth/login") && "POST".equalsIgnoreCase(method)) {
                handleLogin(exchange);
            } else if (path.startsWith("/api/auth/register") && "POST".equalsIgnoreCase(method)) {
                handleRegister(exchange);
            } else if (path.startsWith("/api/skills/catalogue") && "GET".equalsIgnoreCase(method)) {
                handleSkillCatalogue(exchange);
            } else if (path.startsWith("/api/skills/my") && "GET".equalsIgnoreCase(method)) {
                handleMySkills(exchange);
            } else if (path.startsWith("/api/skills/offered/add") && "POST".equalsIgnoreCase(method)) {
                handleAddOfferedSkill(exchange);
            } else if (path.startsWith("/api/skills/offered/remove") && "POST".equalsIgnoreCase(method)) {
                handleRemoveOfferedSkill(exchange);
            } else if (path.startsWith("/api/skills/wanted/add") && "POST".equalsIgnoreCase(method)) {
                handleAddWantedSkill(exchange);
            } else if (path.startsWith("/api/skills/wanted/remove") && "POST".equalsIgnoreCase(method)) {
                handleRemoveWantedSkill(exchange);
            } else if (path.startsWith("/api/peers/profile") && "GET".equalsIgnoreCase(method)) {
                handlePeerProfile(exchange);
            } else if (path.startsWith("/api/peers") && "GET".equalsIgnoreCase(method)) {
                handleFindPeers(exchange);
            } else if (path.startsWith("/api/requests/send") && "POST".equalsIgnoreCase(method)) {
                handleSendRequest(exchange);
            } else if (path.startsWith("/api/requests/incoming") && "GET".equalsIgnoreCase(method)) {
                handleIncomingRequests(exchange);
            } else if (path.startsWith("/api/requests/outgoing") && "GET".equalsIgnoreCase(method)) {
                handleOutgoingRequests(exchange);
            } else if (path.startsWith("/api/requests/respond") && "POST".equalsIgnoreCase(method)) {
                handleRespondRequest(exchange);
            } else if (path.startsWith("/api/matches") && "GET".equalsIgnoreCase(method)) {
                handleMatches(exchange);
            } else if (path.startsWith("/api/feedback/submit") && "POST".equalsIgnoreCase(method)) {
                handleSubmitFeedback(exchange);
            } else if (path.startsWith("/api/feedback/student") && "GET".equalsIgnoreCase(method)) {
                handleStudentFeedback(exchange);
            } else if (path.startsWith("/api/profile/update") && "POST".equalsIgnoreCase(method)) {
                handleUpdateProfile(exchange);
            } else if (path.startsWith("/api/dashboard") && "GET".equalsIgnoreCase(method)) {
                handleDashboard(exchange);
            } else {
                sendResponse(exchange, 404, JsonUtil.errorResponse("API route not found: " + path));
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            sendResponse(exchange, 400, JsonUtil.errorResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, JsonUtil.errorResponse("Server error: " + e.getMessage()));
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        String body = readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonObject(body);
        String email = data.get("email");
        String password = data.get("password");

        Student student = authService.login(email, password);
        String json = "{\"success\":true,\"student\":" + JsonUtil.studentToJson(student) + "}";
        sendResponse(exchange, 200, json);
    }

    private void handleRegister(HttpExchange exchange) throws IOException {
        String body = readBody(exchange);
        Map<String, String> data = JsonUtil.parseJsonObject(body);
        String studentNumber = data.get("studentNumber");
        String fullName = data.get("fullName");
        String email = data.get("email");
        String password = data.get("password");
        String department = data.get("department");
        int year = Integer.parseInt(data.getOrDefault("yearOfStudy", "1"));
        String bio = data.get("bio");

        Student student = authService.register(studentNumber, fullName, email, password, department, year, bio);
        String json = "{\"success\":true,\"student\":" + JsonUtil.studentToJson(student) + "}";
        sendResponse(exchange, 200, json);
    }

    private void handleSkillCatalogue(HttpExchange exchange) throws IOException {
        List<Skill> skills = skillService.getAllSkills();
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < skills.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.skillToJson(skills.get(i)));
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleMySkills(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));

        List<Skill> offered = skillService.getOfferedSkills(studentId);
        List<Skill> wanted = skillService.getWantedSkills(studentId);

        StringBuilder sb = new StringBuilder("{\"offered\":[");
        for (int i = 0; i < offered.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.skillToJson(offered.get(i)));
        }
        sb.append("],\"wanted\":[");
        for (int i = 0; i < wanted.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.skillToJson(wanted.get(i)));
        }
        sb.append("]}");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleAddOfferedSkill(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int studentId = Integer.parseInt(data.get("studentId"));
        int skillId = Integer.parseInt(data.get("skillId"));
        skillService.addOfferedSkill(studentId, skillId);
        sendResponse(exchange, 200, JsonUtil.successResponse("Offered skill added successfully"));
    }

    private void handleRemoveOfferedSkill(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int studentId = Integer.parseInt(data.get("studentId"));
        int skillId = Integer.parseInt(data.get("skillId"));
        skillService.removeOfferedSkill(studentId, skillId);
        sendResponse(exchange, 200, JsonUtil.successResponse("Offered skill removed successfully"));
    }

    private void handleAddWantedSkill(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int studentId = Integer.parseInt(data.get("studentId"));
        int skillId = Integer.parseInt(data.get("skillId"));
        skillService.addWantedSkill(studentId, skillId);
        sendResponse(exchange, 200, JsonUtil.successResponse("Wanted skill added successfully"));
    }

    private void handleRemoveWantedSkill(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int studentId = Integer.parseInt(data.get("studentId"));
        int skillId = Integer.parseInt(data.get("skillId"));
        skillService.removeWantedSkill(studentId, skillId);
        sendResponse(exchange, 200, JsonUtil.successResponse("Wanted skill removed successfully"));
    }

    private void handleFindPeers(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));
        String query = params.get("query");

        List<PeerMatch> matches = peerService.getMatches(studentId, query);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < matches.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.peerMatchToJson(matches.get(i)));
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handlePeerProfile(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int peerId = Integer.parseInt(params.getOrDefault("peerId", "0"));
        int currentUserId = Integer.parseInt(params.getOrDefault("currentUserId", "0"));

        Student peer = studentService.getPeerProfile(peerId);
        double mutual = matchingService.calculateMutualScore(currentUserId, peerId);
        double score = Math.round(mutual * 100.0);

        List<Skill> offered = skillService.getOfferedSkills(peerId);
        List<Skill> wanted = skillService.getWantedSkills(peerId);
        List<Feedback> reviews = feedbackService.getFeedbackForStudent(peerId);
        double avgRating = feedbackService.getAverageRating(peerId);
        boolean hasExisting = requestService.hasExistingRequest(currentUserId, peerId);

        StringBuilder sb = new StringBuilder("{");
        sb.append("\"peer\":").append(JsonUtil.studentToJson(peer)).append(",");
        sb.append("\"matchScore\":").append(score).append(",");
        sb.append("\"avgRating\":").append(String.format(Locale.US, "%.1f", avgRating)).append(",");
        sb.append("\"hasExistingRequest\":").append(hasExisting).append(",");

        sb.append("\"offeredSkills\":[");
        for (int i = 0; i < offered.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.skillToJson(offered.get(i)));
        }
        sb.append("],\"wantedSkills\":[");
        for (int i = 0; i < wanted.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.skillToJson(wanted.get(i)));
        }
        sb.append("],\"reviews\":[");
        for (int i = 0; i < reviews.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.feedbackToJson(reviews.get(i)));
        }
        sb.append("]}");

        sendResponse(exchange, 200, sb.toString());
    }

    private void handleSendRequest(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int senderId = Integer.parseInt(data.get("senderId"));
        int receiverId = Integer.parseInt(data.get("receiverId"));
        String message = data.get("message");

        requestService.sendRequest(senderId, receiverId, message);
        sendResponse(exchange, 200, JsonUtil.successResponse("Skill exchange proposal sent successfully!"));
    }

    private void handleIncomingRequests(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));

        List<SkillExchangeRequest> requests = requestService.getIncomingRequests(studentId);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < requests.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.requestToJson(requests.get(i)));
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleOutgoingRequests(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));

        List<SkillExchangeRequest> requests = requestService.getOutgoingRequests(studentId);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < requests.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.requestToJson(requests.get(i)));
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleRespondRequest(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int requestId = Integer.parseInt(data.get("requestId"));
        String action = data.get("action");
        int currentUserId = Integer.parseInt(data.get("currentUserId"));

        if ("ACCEPT".equalsIgnoreCase(action)) {
            double matchScore = Double.parseDouble(data.getOrDefault("matchScore", "75.0"));
            requestService.acceptRequest(requestId, currentUserId, matchScore);
            sendResponse(exchange, 200, JsonUtil.successResponse("Exchange proposal accepted! Match created."));
        } else {
            requestService.rejectRequest(requestId, currentUserId);
            sendResponse(exchange, 200, JsonUtil.successResponse("Exchange proposal rejected."));
        }
    }

    private void handleMatches(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));

        List<Match> matches = matchService.getMatchesForStudent(studentId);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < matches.size(); i++) {
            if (i > 0) sb.append(",");
            Match m = matches.get(i);
            boolean reviewed = feedbackService.hasSubmittedFeedback(m.getMatchId(), studentId);
            sb.append("{\"match\":").append(JsonUtil.matchToJson(m))
              .append(",\"reviewed\":").append(reviewed).append("}");
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleSubmitFeedback(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int matchId = Integer.parseInt(data.get("matchId"));
        int reviewerId = Integer.parseInt(data.get("reviewerId"));
        int rating = Integer.parseInt(data.get("rating"));
        String comment = data.get("comment");

        feedbackService.submitFeedback(matchId, reviewerId, rating, comment);
        sendResponse(exchange, 200, JsonUtil.successResponse("Rating and review submitted successfully!"));
    }

    private void handleStudentFeedback(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));

        List<Feedback> list = feedbackService.getFeedbackForStudent(studentId);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(JsonUtil.feedbackToJson(list.get(i)));
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleUpdateProfile(HttpExchange exchange) throws IOException {
        Map<String, String> data = JsonUtil.parseJsonObject(readBody(exchange));
        int studentId = Integer.parseInt(data.get("studentId"));
        String fullName = data.get("fullName");
        String department = data.get("department");
        int year = Integer.parseInt(data.getOrDefault("yearOfStudy", "1"));
        String bio = data.get("bio");

        studentService.updateProfile(studentId, fullName, department, year, bio);
        Student updated = studentService.getStudentWithSkills(studentId);
        sendResponse(exchange, 200, "{\"success\":true,\"student\":" + JsonUtil.studentToJson(updated) + "}");
    }

    private void handleDashboard(HttpExchange exchange) throws IOException {
        Map<String, String> params = parseQueryParams(exchange);
        int studentId = Integer.parseInt(params.getOrDefault("studentId", "0"));

        int offeredCount = skillService.getOfferedSkillCount(studentId);
        int wantedCount = skillService.getWantedSkillCount(studentId);
        int activeMatches = matchService.getActiveMatchCount(studentId);
        int pendingReqs = requestService.getIncomingRequests(studentId).stream()
                .filter(SkillExchangeRequest::isPending).toList().size();
        double avgRating = feedbackService.getAverageRating(studentId);

        String json = String.format(
            Locale.US,
            "{\"offeredCount\":%d,\"wantedCount\":%d,\"activeMatches\":%d,\"pendingRequests\":%d,\"avgRating\":%.1f}",
            offeredCount, wantedCount, activeMatches, pendingReqs, avgRating
        );
        sendResponse(exchange, 200, json);
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private Map<String, String> parseQueryParams(HttpExchange exchange) {
        Map<String, String> map = new HashMap<>();
        String query = exchange.getRequestURI().getRawQuery();
        if (query == null || query.isBlank()) return map;

        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2) {
                map.put(
                    URLDecoder.decode(pair[0], StandardCharsets.UTF_8),
                    URLDecoder.decode(pair[1], StandardCharsets.UTF_8)
                );
            }
        }
        return map;
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
