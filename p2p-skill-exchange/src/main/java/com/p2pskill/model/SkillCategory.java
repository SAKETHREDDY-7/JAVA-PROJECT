package com.p2pskill.model;

/**
 * Represents a skill category (e.g., "Programming Languages", "Data Science").
 *
 * OOP Concepts:
 *  - Encapsulation: all fields private, accessed via getters/setters
 *  - Constructor overloading: default + parameterized constructors
 *
 * Member 2 responsibility (model package).
 */
public class SkillCategory {

    private int    categoryId;
    private String categoryName;
    private String description;

    // ── Constructors ────────────────────────────────────────

    public SkillCategory() {}

    public SkillCategory(int categoryId, String categoryName, String description) {
        this.categoryId   = categoryId;
        this.categoryName = categoryName;
        this.description  = description;
    }

    /** Constructor without ID — used when creating a new category before DB insert. */
    public SkillCategory(String categoryName, String description) {
        this.categoryName = categoryName;
        this.description  = description;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(int categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    // ── Object methods ──────────────────────────────────────

    @Override
    public String toString() {
        return categoryName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SkillCategory)) return false;
        SkillCategory other = (SkillCategory) o;
        return categoryId == other.categoryId;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(categoryId);
    }
}
