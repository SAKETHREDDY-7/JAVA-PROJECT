package com.p2pskill.model;

/**
 * Represents a single normalized skill in the catalogue.
 * Skills are never stored as raw text in student rows —
 * students reference Skill objects by skill_id.
 *
 * OOP Concepts:
 *  - Encapsulation: private fields, public accessors
 *  - Composition: contains a SkillCategory object
 *  - Constructor overloading
 *
 * Used in:
 *  - SkillDAO (load from DB)
 *  - SkillService (business logic)
 *  - FeatureVectorBuilder (ML index mapping)
 *  - ManageSkillsController (UI display)
 *
 * Member 2 responsibility (model package).
 */
public class Skill {

    private int           skillId;
    private String        skillName;
    private SkillCategory category;   // composition — holds full category object

    // ── Constructors ────────────────────────────────────────

    public Skill() {}

    public Skill(int skillId, String skillName, SkillCategory category) {
        this.skillId   = skillId;
        this.skillName = skillName;
        this.category  = category;
    }

    /** Lightweight constructor — category populated lazily if needed. */
    public Skill(int skillId, String skillName) {
        this.skillId   = skillId;
        this.skillName = skillName;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getSkillId() {
        return skillId;
    }

    public void setSkillId(int skillId) {
        this.skillId = skillId;
    }

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public SkillCategory getCategory() {
        return category;
    }

    public void setCategory(SkillCategory category) {
        this.category = category;
    }

    /** Convenience: return category name or empty string if category not loaded. */
    public String getCategoryName() {
        return category != null ? category.getCategoryName() : "";
    }

    // ── Object methods ──────────────────────────────────────

    /**
     * toString returns just the skill name.
     * This is used directly by JavaFX ComboBox and ListView renderers.
     */
    @Override
    public String toString() {
        return skillName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Skill)) return false;
        Skill other = (Skill) o;
        return skillId == other.skillId;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(skillId);
    }
}
