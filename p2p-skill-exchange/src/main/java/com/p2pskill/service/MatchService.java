package com.p2pskill.service;

import com.p2pskill.dao.MatchDAO;
import com.p2pskill.dao.SkillDAO;
import com.p2pskill.model.Match;
import com.p2pskill.model.Skill;
import com.p2pskill.util.SessionManager;

import java.util.List;

/**
 * Service class for managing confirmed skill-exchange matches.
 */
public class MatchService {

    private final MatchDAO matchDAO;
    private final SkillDAO skillDAO;

    public MatchService() {
        this.matchDAO = new MatchDAO();
        this.skillDAO = new SkillDAO();
    }

    public MatchService(MatchDAO matchDAO, SkillDAO skillDAO) {
        this.matchDAO = matchDAO;
        this.skillDAO = skillDAO;
    }

    public List<Match> getMyMatches() {
        return getMatchesForStudent(SessionManager.getInstance().getCurrentUserId());
    }

    public List<Match> getMatchesForStudent(int studentId) {
        return matchDAO.findActiveMatchesByStudent(studentId);
    }

    public int getActiveMatchCount() {
        return getActiveMatchCount(SessionManager.getInstance().getCurrentUserId());
    }

    public int getActiveMatchCount(int studentId) {
        return matchDAO.countActiveMatchesByStudent(studentId);
    }

    public Match getMatchById(int matchId) {
        Match match = matchDAO.findById(matchId)
            .orElseThrow(() -> new IllegalArgumentException("Match not found."));

        int myId = SessionManager.getInstance().getCurrentUserId();
        if (match.getStudentId1() != myId && match.getStudentId2() != myId) {
            throw new IllegalArgumentException("You are not a participant in this match.");
        }
        return match;
    }

    public List<Skill> getPeerOfferedSkills(int matchId) {
        int myId  = SessionManager.getInstance().getCurrentUserId();
        Match m   = getMatchById(matchId);
        int peerId = m.getPeerId(myId);
        return skillDAO.findOfferedSkills(peerId);
    }

    public List<Skill> getPeerWantedSkills(int matchId) {
        int myId  = SessionManager.getInstance().getCurrentUserId();
        Match m   = getMatchById(matchId);
        int peerId = m.getPeerId(myId);
        return skillDAO.findWantedSkills(peerId);
    }
}
