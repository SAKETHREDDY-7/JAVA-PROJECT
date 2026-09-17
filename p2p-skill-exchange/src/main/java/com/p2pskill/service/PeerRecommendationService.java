package com.p2pskill.service;

import com.p2pskill.algorithm.MatchingAlgorithm;
import com.p2pskill.dao.SkillDAO;
import com.p2pskill.dao.StudentDAO;
import com.p2pskill.model.PeerMatch;
import com.p2pskill.model.Skill;
import com.p2pskill.model.Student;
import com.p2pskill.util.SessionManager;

import java.util.ArrayList;
import java.util.List;

/**
 * Service class to find and recommend compatible peers for skill exchange.
 */
public class PeerRecommendationService {

    private final StudentDAO studentDAO;
    private final SkillDAO skillDAO;
    private final MatchingService matchingService;

    public PeerRecommendationService() {
        this.studentDAO = new StudentDAO();
        this.skillDAO = new SkillDAO();
        this.matchingService = new MatchingService(this.skillDAO);
    }

    public PeerRecommendationService(StudentDAO studentDAO, SkillDAO skillDAO, MatchingService matchingService) {
        this.studentDAO = studentDAO;
        this.skillDAO = skillDAO;
        this.matchingService = matchingService;
    }

    public List<PeerMatch> getMatches(String keyword) {
        return getMatches(SessionManager.getInstance().getCurrentUserId(), keyword);
    }

    public List<PeerMatch> getMatches(int currentStudentId, String keyword) {
        List<PeerMatch> matches = new ArrayList<>();
        List<Student> peers = studentDAO.findAllExcept(currentStudentId);

        for (Student peer : peers) {
            List<Skill> theyTeach = matchingService.getSkillsTheyOfferIWant(currentStudentId, peer.getStudentId());
            List<Skill> youTeach = matchingService.getSkillsIOfferTheyWant(currentStudentId, peer.getStudentId());

            if (!matchesKeyword(keyword, peer, theyTeach, youTeach)) {
                continue;
            }

            double mutualRatio = matchingService.calculateMutualScore(currentStudentId, peer.getStudentId());
            double score = Math.round(mutualRatio * 100.0);

            matches.add(new PeerMatch(peer, score, theyTeach, youTeach));
        }

        // Sort descending using MatchingAlgorithm
        MatchingAlgorithm.sortMatches(matches);

        return matches;
    }

    public PeerMatch getBestMatch() {
        List<PeerMatch> matches = getMatches(null);
        return MatchingAlgorithm.getBest(matches);
    }

    private boolean matchesKeyword(String keyword, Student peer, List<Skill> theyTeach, List<Skill> youTeach) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String searchText = keyword.trim().toLowerCase();

        // Match student name or department
        if (peer.getFullName() != null && peer.getFullName().toLowerCase().contains(searchText)) {
            return true;
        }
        if (peer.getDepartment() != null && peer.getDepartment().toLowerCase().contains(searchText)) {
            return true;
        }

        // Match skills
        return containsSkill(theyTeach, searchText) || containsSkill(youTeach, searchText);
    }

    private boolean containsSkill(List<Skill> skills, String searchText) {
        for (Skill skill : skills) {
            if (skill.getSkillName().toLowerCase().contains(searchText)) {
                return true;
            }
        }
        return false;
    }
}
