package com.p2pskill.web;

import com.p2pskill.model.*;

import java.util.*;

/**
 * Lightweight JSON Utility class written in pure standard Java.
 * Avoids bulky external libraries (like Jackson or Gson) so that every single
 * line of code can be explained simply during academic evaluations.
 */
public class JsonUtil {

    public static Map<String, String> parseJsonObject(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.isBlank()) return map;

        String trimmed = json.trim();
        if (trimmed.startsWith("{")) trimmed = trimmed.substring(1);
        if (trimmed.endsWith("}")) trimmed = trimmed.substring(0, trimmed.length() - 1);

        String[] pairs = trimmed.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        for (String pair : pairs) {
            String[] kv = pair.split(":", 2);
            if (kv.length == 2) {
                String key = cleanString(kv[0]);
                String val = cleanString(kv[1]);
                map.put(key, val);
            }
        }
        return map;
    }

    private static String cleanString(String s) {
        s = s.trim();
        if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) {
            s = s.substring(1, s.length() - 1);
        }
        return s.replace("\\\"", "\"").replace("\\\\", "\\");
    }

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public static String successResponse(String message) {
        return "{\"success\":true,\"message\":\"" + escape(message) + "\"}";
    }

    public static String errorResponse(String message) {
        return "{\"success\":false,\"error\":\"" + escape(message) + "\"}";
    }

    public static String studentToJson(Student s) {
        if (s == null) return "null";
        return String.format(
            Locale.US,
            "{\"studentId\":%d,\"studentNumber\":\"%s\",\"fullName\":\"%s\",\"email\":\"%s\",\"department\":\"%s\",\"yearOfStudy\":%d,\"bio\":\"%s\"}",
            s.getStudentId(),
            escape(s.getStudentNumber()),
            escape(s.getFullName()),
            escape(s.getEmail()),
            escape(s.getDepartment()),
            s.getYearOfStudy(),
            escape(s.getBio() != null ? s.getBio() : "")
        );
    }

    public static String skillToJson(Skill s) {
        if (s == null) return "null";
        String catName = (s.getCategory() != null) ? escape(s.getCategory().getCategoryName()) : "General";
        int catId = (s.getCategory() != null) ? s.getCategory().getCategoryId() : 1;
        return String.format(
            Locale.US,
            "{\"skillId\":%d,\"skillName\":\"%s\",\"categoryId\":%d,\"categoryName\":\"%s\"}",
            s.getSkillId(),
            escape(s.getSkillName()),
            catId,
            catName
        );
    }

    public static String peerMatchToJson(PeerMatch pm) {
        if (pm == null || pm.getPeer() == null) return "null";
        Student p = pm.getPeer();
        StringBuilder canTeach = new StringBuilder("[");
        for (int i = 0; i < pm.getCanTeachMe().size(); i++) {
            if (i > 0) canTeach.append(",");
            canTeach.append(skillToJson(pm.getCanTeachMe().get(i)));
        }
        canTeach.append("]");

        StringBuilder wantsFromMe = new StringBuilder("[");
        for (int i = 0; i < pm.getWantsFromMe().size(); i++) {
            if (i > 0) wantsFromMe.append(",");
            wantsFromMe.append(skillToJson(pm.getWantsFromMe().get(i)));
        }
        wantsFromMe.append("]");

        return String.format(
            Locale.US,
            "{\"peer\":%s,\"score\":%.1f,\"canTeachMe\":%s,\"wantsFromMe\":%s}",
            studentToJson(p),
            pm.getScore(),
            canTeach.toString(),
            wantsFromMe.toString()
        );
    }

    public static String requestToJson(SkillExchangeRequest r) {
        if (r == null) return "null";
        String senderName = (r.getSender() != null) ? escape(r.getSender().getFullName()) : "Student #" + r.getSenderId();
        String senderDept = (r.getSender() != null) ? escape(r.getSender().getDepartment()) : "";
        String receiverName = (r.getReceiver() != null) ? escape(r.getReceiver().getFullName()) : "Student #" + r.getReceiverId();
        String receiverDept = (r.getReceiver() != null) ? escape(r.getReceiver().getDepartment()) : "";

        return String.format(
            Locale.US,
            "{\"requestId\":%d,\"senderId\":%d,\"senderName\":\"%s\",\"senderDept\":\"%s\",\"receiverId\":%d,\"receiverName\":\"%s\",\"receiverDept\":\"%s\",\"message\":\"%s\",\"status\":\"%s\",\"createdAt\":\"%s\"}",
            r.getRequestId(),
            r.getSenderId(),
            senderName,
            senderDept,
            r.getReceiverId(),
            receiverName,
            receiverDept,
            escape(r.getMessage() != null ? r.getMessage() : ""),
            r.getStatus() != null ? r.getStatus().name() : "PENDING",
            r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
        );
    }

    public static String matchToJson(Match m) {
        if (m == null) return "null";
        return String.format(
            Locale.US,
            "{\"matchId\":%d,\"requestId\":%d,\"studentId1\":%d,\"studentId2\":%d,\"matchScore\":%.1f,\"isActive\":%b,\"matchedAt\":\"%s\",\"student1\":%s,\"student2\":%s}",
            m.getMatchId(),
            m.getRequestId(),
            m.getStudentId1(),
            m.getStudentId2(),
            m.getMatchScore(),
            m.isActive(),
            m.getMatchedAt() != null ? m.getMatchedAt().toString() : "",
            studentToJson(m.getStudent1()),
            studentToJson(m.getStudent2())
        );
    }

    public static String feedbackToJson(Feedback f) {
        if (f == null) return "null";
        return String.format(
            Locale.US,
            "{\"feedbackId\":%d,\"matchId\":%d,\"reviewerId\":%d,\"reviewerName\":\"%s\",\"reviewedId\":%d,\"rating\":%d,\"ratingStars\":\"%s\",\"comment\":\"%s\",\"createdAt\":\"%s\"}",
            f.getFeedbackId(),
            f.getMatchId(),
            f.getReviewerId(),
            escape(f.getReviewerName() != null ? f.getReviewerName() : "Peer"),
            f.getReviewedId(),
            f.getRating(),
            escape(f.getRatingStars()),
            escape(f.getComment() != null ? f.getComment() : ""),
            f.getCreatedAt() != null ? f.getCreatedAt().toString() : ""
        );
    }
}
