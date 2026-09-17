package com.p2pskill.model;

/**
 * Enum representing all possible states of a SkillExchangeRequest.
 *
 * Lifecycle:
 *   PENDING  → ACCEPTED  (creates a Match)
 *   PENDING  → REJECTED  (request is declined, recorded)
 *
 * Member 2 responsibility (model package).
 */
public enum RequestStatus {
    PENDING,
    ACCEPTED,
    REJECTED
}
