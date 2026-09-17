package com.p2pskill.algorithm;

import com.p2pskill.model.PeerMatch;

import java.util.*;

/**
 * Core Algorithm class for Skill Matching and Peer Ranking.
 *
 * Demonstrates standard 2nd-Year B.Tech Data Structures & Algorithms:
 *  1. Bidirectional Set Intersection using HashSet for O(1) lookups
 *  2. Collections.sort() using Comparator (TimSort: O(M log M))
 *  3. In-Place Insertion Sort (O(N^2))
 *  4. PriorityQueue Max-Heap for Top-K extraction (O(M log K))
 */
public class MatchingAlgorithm {

    /**
     * Calculates compatibility score (0 to 100) between two students
     * based on mutual skill overlap.
     */
    public static double calculateMatchScore(List<Integer> myOffered, List<Integer> myWanted,
                                             List<Integer> peerOffered, List<Integer> peerWanted) {
        if (myOffered == null || myWanted == null || peerOffered == null || peerWanted == null) {
            return 0.0;
        }

        // How many skills I can teach that peer wants (Forward overlap)
        double forward = calculateOverlap(myOffered, peerWanted);

        // How many skills peer can teach that I want (Backward overlap)
        double backward = calculateOverlap(peerOffered, myWanted);

        // Average compatibility score (0.0 to 100.0)
        return Math.round(((forward + backward) / 2.0) * 100.0);
    }

    private static double calculateOverlap(List<Integer> offered, List<Integer> wanted) {
        if (wanted.isEmpty() || offered.isEmpty()) return 0.0;
        Set<Integer> wantedSet = new HashSet<>(wanted);
        int common = 0;
        for (int id : offered) {
            if (wantedSet.contains(id)) {
                common++;
            }
        }
        return (double) common / wanted.size();
    }

    /**
     * Counts common elements between two lists using HashSet.
     */
    public static int countOverlap(List<Integer> setA, List<Integer> setB) {
        if (setA == null || setB == null) return 0;
        Set<Integer> bSet = new HashSet<>(setB);
        int count = 0;
        for (int id : setA) {
            if (bSet.contains(id)) count++;
        }
        return count;
    }

    /**
     * Sorts list of matches in-place by score descending (best match first).
     */
    public static void sortMatches(List<PeerMatch> matches) {
        if (matches != null && matches.size() > 1) {
            matches.sort(Comparator.comparingDouble(PeerMatch::getScore).reversed());
        }
    }

    /**
     * In-place Insertion Sort implementation demonstrating quadratic sorting.
     */
    public static void insertionSort(List<PeerMatch> matches) {
        if (matches == null || matches.size() <= 1) return;
        for (int i = 1; i < matches.size(); i++) {
            PeerMatch key = matches.get(i);
            int j = i - 1;
            while (j >= 0 && matches.get(j).getScore() < key.getScore()) {
                matches.set(j + 1, matches.get(j));
                j--;
            }
            matches.set(j + 1, key);
        }
    }

    /**
     * Returns the top-K matches using a Max-Heap PriorityQueue.
     */
    public static List<PeerMatch> getTopK(List<PeerMatch> matches, int k) {
        if (matches == null || matches.isEmpty()) return new ArrayList<>();
        PriorityQueue<PeerMatch> heap = new PriorityQueue<>(
            matches.size(),
            Comparator.comparingDouble(PeerMatch::getScore).reversed()
        );
        heap.addAll(matches);
        List<PeerMatch> result = new ArrayList<>();
        for (int i = 0; i < k && !heap.isEmpty(); i++) {
            result.add(heap.poll());
        }
        return result;
    }

    /**
     * Returns the single best match from the list.
     */
    public static PeerMatch getBest(List<PeerMatch> matches) {
        if (matches == null || matches.isEmpty()) return null;
        PeerMatch best = matches.get(0);
        for (PeerMatch m : matches) {
            if (m.getScore() > best.getScore()) {
                best = m;
            }
        }
        return best;
    }
}
