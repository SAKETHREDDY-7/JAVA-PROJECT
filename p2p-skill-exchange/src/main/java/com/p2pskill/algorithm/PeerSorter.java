package com.p2pskill.algorithm;

import com.p2pskill.model.PeerMatch;

import java.util.Comparator;
import java.util.List;

/**
 * Provides sorting utilities for peer match lists.
 *
 * Demonstrates standard sorting algorithms for B.Tech mini project:
 *  1. Collections.sort() using Comparator (TimSort: O(M log M))
 *  2. Custom Insertion Sort (O(N^2) worst case, O(N) best case)
 */
public final class PeerSorter {

    private PeerSorter() {}

    /**
     * Sorts the match list in-place by score descending.
     * Best match (highest %) appears first.
     *
     * @param matches the list to sort (modified in-place)
     */
    public static void sortByScoreDesc(List<PeerMatch> matches) {
        if (matches == null || matches.size() <= 1) return;

        matches.sort(
            Comparator.comparingDouble(PeerMatch::getScore).reversed()
        );
    }

    /**
     * Custom insertion sort implementation for peer match lists.
     * Demonstrates knowledge of in-place quadratic sorting algorithms.
     *
     * Time complexity:  O(N²) worst/average case, O(N) best case (nearly sorted)
     * Space complexity: O(1) in-place
     *
     * @param matches list of peer matches
     */
    public static void insertionSortByScoreDesc(List<PeerMatch> matches) {
        if (matches == null || matches.size() <= 1) return;

        int n = matches.size();
        for (int i = 1; i < n; i++) {
            PeerMatch key = matches.get(i);
            int j = i - 1;

            // Shift elements with smaller score to the right
            while (j >= 0 && matches.get(j).getScore() < key.getScore()) {
                matches.set(j + 1, matches.get(j));
                j--;
            }
            matches.set(j + 1, key);
        }
    }
}
