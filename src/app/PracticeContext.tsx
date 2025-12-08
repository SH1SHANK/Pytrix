"use client";

import React, { createContext, useContext, useState } from "react";
import { Stats, Topic } from "@/lib/types";
import { TOPICS } from "@/lib/mockQuestions";
import {
  getStats,
  incrementAttempt as storeIncrementAttempt,
  GlobalStats,
} from "@/lib/statsStore";

interface PracticeContextType {
  stats: Stats;
  topics: Topic[];
  incrementSolved: (topicName: string) => void;
  incrementAttempts: (topicName: string, isCorrect: boolean) => void;
  refreshStats: () => void;
}

/**
 * Convert GlobalStats from statsStore to the Stats interface used in UI.
 */
function mapGlobalStatsToStats(gs: GlobalStats): Stats {
  return {
    problemsSolved: gs.totalSolved,
    totalAttempts: gs.totalAttempts,
    topicsTouched: gs.topicsTouched,
    totalTopics: TOPICS.length,
    masteryPercent: gs.masteryPercent,
    // Difficulty breakdowns not tracked yet; set to 0
    easyPercent: 0,
    mediumPercent: 0,
    hardPercent: 0,
  };
}

/**
 * Derive topic progress from GlobalStats.
 */
function deriveTopicsFromStats(gs: GlobalStats): Topic[] {
  return TOPICS.map((t) => {
    const topicStats = gs.perTopic.find(
      (p) => p.topic.toLowerCase() === t.name.toLowerCase()
    );
    const solved = topicStats?.solved || 0;
    return {
      ...t,
      problemsSolved: solved,
    };
  });
}

const PracticeContext = createContext<PracticeContextType | undefined>(
  undefined
);

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  // Initialize directly from localStorage using lazy initializers
  // This avoids the need for a useEffect that calls setState synchronously
  const [stats, setStats] = useState<Stats>(() => {
    // Check if we're on the client (localStorage available)
    if (typeof window === "undefined") {
      // Server-side: return defaults
      return {
        problemsSolved: 0,
        totalAttempts: 0,
        topicsTouched: 0,
        totalTopics: TOPICS.length,
        masteryPercent: 0,
        easyPercent: 0,
        mediumPercent: 0,
        hardPercent: 0,
      };
    }
    // Client-side: hydrate from localStorage
    const globalStats = getStats();
    return mapGlobalStatsToStats(globalStats);
  });

  const [topics, setTopics] = useState<Topic[]>(() => {
    if (typeof window === "undefined") {
      return TOPICS;
    }
    const globalStats = getStats();
    return deriveTopicsFromStats(globalStats);
  });

  function refreshStats() {
    const globalStats = getStats();
    setStats(mapGlobalStatsToStats(globalStats));
    setTopics(deriveTopicsFromStats(globalStats));
  }

  function incrementSolved(topicName: string) {
    // This is a convenience wrapper - call with isCorrect=true
    incrementAttempts(topicName, true);
  }

  function incrementAttempts(topicName: string, isCorrect: boolean) {
    // Update persistent store
    const newGlobalStats = storeIncrementAttempt(topicName, isCorrect);

    // Sync React state
    setStats(mapGlobalStatsToStats(newGlobalStats));
    setTopics(deriveTopicsFromStats(newGlobalStats));
  }

  return (
    <PracticeContext.Provider
      value={{
        stats,
        topics,
        incrementSolved,
        incrementAttempts,
        refreshStats,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error("usePractice must be used within a PracticeProvider");
  }
  return context;
}
