package com.p2pskill.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Model class representing a matched peer for skill exchange.
 * Encapsulates the peer's student profile, compatibility match score,
 * and the list of skills they can teach vs skills you can teach.
 *
 * Demonstrates Object-Oriented Programming (OOP) Encapsulation.
 */
public class PeerMatch {

    private Student peer;
    private double score;
    private List<Skill> theyTeach;
    private List<Skill> youTeach;

    public PeerMatch() {
        this.theyTeach = new ArrayList<>();
        this.youTeach = new ArrayList<>();
    }

    public PeerMatch(Student peer, double score, List<Skill> theyTeach, List<Skill> youTeach) {
        this.peer = peer;
        this.score = score;
        this.theyTeach = (theyTeach != null) ? theyTeach : new ArrayList<>();
        this.youTeach = (youTeach != null) ? youTeach : new ArrayList<>();
    }

    public Student getPeer() {
        return peer;
    }

    public void setPeer(Student peer) {
        this.peer = peer;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getScoreText() {
        return String.format("%.0f%%", score);
    }

    public List<Skill> getTheyTeach() {
        return theyTeach;
    }

    public void setTheyTeach(List<Skill> theyTeach) {
        this.theyTeach = theyTeach;
    }

    public List<Skill> getYouTeach() {
        return youTeach;
    }

    public void setYouTeach(List<Skill> youTeach) {
        this.youTeach = youTeach;
    }

    public List<Skill> getCanTeachMe() {
        return theyTeach;
    }

    public List<Skill> getWantsFromMe() {
        return youTeach;
    }

    @Override
    public String toString() {
        return "PeerMatch{" +
                "peer=" + (peer != null ? peer.getFullName() : "null") +
                ", score=" + score + "%" +
                ", theyTeach=" + theyTeach.size() +
                ", youTeach=" + youTeach.size() +
                '}';
    }
}
