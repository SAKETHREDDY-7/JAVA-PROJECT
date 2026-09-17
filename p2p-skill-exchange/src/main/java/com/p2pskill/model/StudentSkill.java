package com.p2pskill.model;

import java.time.LocalDateTime;

/**
 * Represents a junction record linking a Student to a Skill
 * they either offer or want to learn.
 *
 * This class is used internally when both the student context
 * AND the timestamp of skill addition need to be preserved together.
 * In most application code, skills are accessed directly from
 * Student.getOfferedSkills() / Student.getWantedSkills().
 *
 * OOP Concepts:
 *  - Encapsulation
 *  - Composition: holds Student and Skill objects
 *
 * Member 2 responsibility (model package).
 */
public class StudentSkill {

    public enum SkillType { OFFERED, WANTED }

    private int           studentId;
    private int           skillId;
    private Skill         skill;       // populated on join queries
    private SkillType     skillType;
    private LocalDateTime addedAt;

    // ── Constructors ────────────────────────────────────────

    public StudentSkill() {}

    public StudentSkill(int studentId, int skillId, SkillType skillType) {
        this.studentId = studentId;
        this.skillId   = skillId;
        this.skillType = skillType;
    }

    public StudentSkill(int studentId, Skill skill, SkillType skillType,
                        LocalDateTime addedAt) {
        this.studentId = studentId;
        this.skill     = skill;
        this.skillId   = skill.getSkillId();
        this.skillType = skillType;
        this.addedAt   = addedAt;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public int getSkillId() { return skillId; }
    public void setSkillId(int skillId) { this.skillId = skillId; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) {
        this.skill   = skill;
        this.skillId = skill != null ? skill.getSkillId() : 0;
    }

    public SkillType getSkillType() { return skillType; }
    public void setSkillType(SkillType skillType) { this.skillType = skillType; }

    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }

    // ── Object methods ──────────────────────────────────────

    @Override
    public String toString() {
        String name = skill != null ? skill.getSkillName() : "skill#" + skillId;
        return "[" + skillType + "] " + name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentSkill)) return false;
        StudentSkill other = (StudentSkill) o;
        return studentId == other.studentId
            && skillId   == other.skillId
            && skillType == other.skillType;
    }

    @Override
    public int hashCode() {
        return 31 * studentId + 17 * skillId + skillType.hashCode();
    }
}
