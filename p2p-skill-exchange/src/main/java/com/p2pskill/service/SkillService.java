package com.p2pskill.service;

import com.p2pskill.dao.SkillDAO;
import com.p2pskill.model.Skill;
import com.p2pskill.model.SkillCategory;
import com.p2pskill.util.SessionManager;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service class for managing student offered and wanted skills.
 */
public class SkillService {

    private final SkillDAO skillDAO;

    public SkillService() {
        this.skillDAO = new SkillDAO();
    }

    public SkillService(SkillDAO skillDAO) {
        this.skillDAO = skillDAO;
    }

    public List<Skill> getAllSkills() {
        return skillDAO.findAllSkills();
    }

    public List<SkillCategory> getAllCategories() {
        return skillDAO.findAllCategories();
    }

    public List<Skill> getSkillsByCategory(int categoryId) {
        return skillDAO.findByCategory(categoryId);
    }

    public List<Skill> getOfferedSkills(int studentId) {
        return skillDAO.findOfferedSkills(studentId);
    }

    public void addOfferedSkill(int skillId) {
        addOfferedSkill(SessionManager.getInstance().getCurrentUserId(), skillId);
    }

    public void addOfferedSkill(int studentId, int skillId) {
        Set<Integer> wantedIds = new HashSet<>(skillDAO.findWantedSkillIds(studentId));
        if (wantedIds.contains(skillId)) {
            throw new IllegalArgumentException("You cannot offer a skill you are also trying to learn. Remove it from your Wanted Skills first.");
        }
        skillDAO.addOfferedSkill(studentId, skillId);
    }

    public void removeOfferedSkill(int skillId) {
        removeOfferedSkill(SessionManager.getInstance().getCurrentUserId(), skillId);
    }

    public void removeOfferedSkill(int studentId, int skillId) {
        skillDAO.removeOfferedSkill(studentId, skillId);
    }

    public List<Skill> getWantedSkills(int studentId) {
        return skillDAO.findWantedSkills(studentId);
    }

    public void addWantedSkill(int skillId) {
        addWantedSkill(SessionManager.getInstance().getCurrentUserId(), skillId);
    }

    public void addWantedSkill(int studentId, int skillId) {
        Set<Integer> offeredIds = new HashSet<>(skillDAO.findOfferedSkillIds(studentId));
        if (offeredIds.contains(skillId)) {
            throw new IllegalArgumentException("You are already offering this skill. Remove it from your Offered Skills first.");
        }
        skillDAO.addWantedSkill(studentId, skillId);
    }

    public void removeWantedSkill(int skillId) {
        removeWantedSkill(SessionManager.getInstance().getCurrentUserId(), skillId);
    }

    public void removeWantedSkill(int studentId, int skillId) {
        skillDAO.removeWantedSkill(studentId, skillId);
    }

    public int getOfferedSkillCount(int studentId) {
        return skillDAO.findOfferedSkillIds(studentId).size();
    }

    public int getWantedSkillCount(int studentId) {
        return skillDAO.findWantedSkillIds(studentId).size();
    }
}
