package com.p2pskill.algorithm;

import com.p2pskill.model.PeerMatch;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Ranks a list of PeerMatch results using a max-heap PriorityQueue.
 *
 * Data Structure: PriorityQueue (max-heap ordered by match score)
 * ─────────────────────────────────────────────────────────────────
 * Why PriorityQueue?
 *  - Extracting the top-K recommendations from a large peer list.
 *  - Building the heap takes O(M) or O(M log M), and extracting
 *    top K elements is O(K log M).
 *  - Efficient when K is smaller than total peers M.
 *
 * Time complexity:  O(M log K) or O(M log M)
 * Space complexity: O(M)
 */
public final class PeerRanker {

    private PeerRanker() {}

    /**
     * Returns the top-N recommendations from a list, ranked by
     * match score descending, using a max-heap.
     *
     * @param matches the full list of peer matches
     * @param topN    how many to return (use -1 or 0 for all)
     * @return top-N matches sorted best-first
     */
    public static List<PeerMatch> topN(List<PeerMatch> matches, int topN) {
        if (matches == null || matches.isEmpty()) {
            return new ArrayList<>();
        }

        int limit = (topN <= 0 || topN >= matches.size()) ? matches.size() : topN;

        // Max-heap: highest score has highest priority
        PriorityQueue<PeerMatch> maxHeap = new PriorityQueue<>(
            matches.size(),
            Comparator.comparingDouble(PeerMatch::getScore).reversed()
        );

        maxHeap.addAll(matches);

        List<PeerMatch> ranked = new ArrayList<>(limit);
        for (int i = 0; i < limit && !maxHeap.isEmpty(); i++) {
            ranked.add(maxHeap.poll());
        }
        return ranked;
    }

    /**
     * Returns the single best match from the list.
     *
     * @param matches the list to search
     * @return the PeerMatch with the highest match %, or null
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
