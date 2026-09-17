package com.p2pskill.service;

import com.p2pskill.algorithm.MatchingAlgorithm;
import com.p2pskill.dao.SkillDAO;
import com.p2pskill.model.Skill;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service for computing skill matches and overlaps between students.
 */
public class MatchingService {

    private final SkillDAO skillDAO;

    public MatchingService() {
        this.skillDAO = new SkillDAO();
    }

    public MatchingService(SkillDAO skillDAO) {
        this.skillDAO = skillDAO;
    }

    public double calculateMutualScore(int studentIdA, int studentIdB) {
        List<Integer> aOffered = skillDAO.findOfferedSkillIds(studentIdA);
        List<Integer> aWanted  = skillDAO.findWantedSkillIds(studentIdA);
        List<Integer> bOffered = skillDAO.findOfferedSkillIds(studentIdB);
        List<Integer> bWanted  = skillDAO.findWantedSkillIds(studentIdB);

        return MatchingAlgorithm.calculateMatchScore(aOffered, aWanted, bOffered, bWanted) / 100.0;
    }

    public List<Skill> getSkillsIOfferTheyWant(int myId, int peerId) {
        List<Skill> myOffered   = skillDAO.findOfferedSkills(myId);
        Set<Integer> theyWanted = new HashSet<>(skillDAO.findWantedSkillIds(peerId));

        List<Skill> result = new ArrayList<>();
        for (Skill s : myOffered) {
            if (theyWanted.contains(s.getSkillId())) {
                result.add(s);
            }
        }
        return result;
    }

    public List<Skill> getSkillsTheyOfferIWant(int myId, int peerId) {
        List<Skill> theyOffer = skillDAO.findOfferedSkills(peerId);
        Set<Integer> iWant    = new HashSet<>(skillDAO.findWantedSkillIds(myId));

        List<Skill> result = new ArrayList<>();
        for (Skill s : theyOffer) {
            if (iWant.contains(s.getSkillId())) {
                result.add(s);
            }
        }
        return result;
    }
}
