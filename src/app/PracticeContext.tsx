"use client";

import React, { createContext, useContext, useState } from "react";
import { Stats, Topic, DifficultyLevel } from "@/lib/types";
import { TOPICS } from "@/lib/mockQuestions";
import {
  getStats,
  incrementAttempt as storeIncrementAttempt,
  GlobalStats,
} from "@/lib/statsStore";

interface PracticeContextType {
  stats: Stats;
  topics: Topic[];
  incrementSolved: (topicName: string, difficulty?: DifficultyLevel) => void;
  incrementAttempts: (
    topicName: string,
    isCorrect: boolean,
    difficulty?: DifficultyLevel
  ) => void;
  refreshStats: () => void;
}

/**
 * Convert GlobalStats from statsStore to the Stats interface used in UI.
 */
function mapGlobalStatsToStats(gs: GlobalStats): Stats {
  // Sum per-difficulty solved counts across all topics
  let beginnerSolved = 0;
  let intermediateSolved = 0;
  let advancedSolved = 0;

  for (const topic of gs.perTopic) {
    beginnerSolved += topic.beginner?.solved || 0;
    intermediateSolved += topic.intermediate?.solved || 0;
    advancedSolved += topic.advanced?.solved || 0;
  }

  return {
    problemsSolved: gs.totalSolved,
    totalAttempts: gs.totalAttempts,
    topicsTouched: gs.topicsTouched,
    totalTopics: TOPICS.length,
    masteryPercent: gs.masteryPercent,
    beginnerSolved,
    intermediateSolved,
    advancedSolved,
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

    return {
      ...t,
      problemsSolved: topicStats?.solved || 0,
      beginnerSolved: topicStats?.beginner?.solved || 0,
      intermediateSolved: topicStats?.intermediate?.solved || 0,
      advancedSolved: topicStats?.advanced?.solved || 0,
    };
  });
}

const PracticeContext = createContext<PracticeContextType | undefined>(
  undefined
);

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  // Initialize directly from localStorage using lazy initializers
  const [stats, setStats] = useState<Stats>(() => {
    if (typeof window === "undefined") {
      return {
        problemsSolved: 0,
        totalAttempts: 0,
        topicsTouched: 0,
        totalTopics: TOPICS.length,
        masteryPercent: 0,
        beginnerSolved: 0,
        intermediateSolved: 0,
        advancedSolved: 0,
      };
    }
    const globalStats = getStats();
    return mapGlobalStatsToStats(globalStats);
  });

  const [topics, setTopics] = useState<Topic[]>(() => {
    if (typeof window === "undefined") {
      return TOPICS.map((t) => ({
        ...t,
        beginnerSolved: 0,
        intermediateSolved: 0,
        advancedSolved: 0,
      }));
    }
    const globalStats = getStats();
    return deriveTopicsFromStats(globalStats);
  });

  function refreshStats() {
    const globalStats = getStats();
    setStats(mapGlobalStatsToStats(globalStats));
    setTopics(deriveTopicsFromStats(globalStats));
  }

  function incrementSolved(
    topicName: string,
    difficulty: DifficultyLevel = "beginner"
  ) {
    incrementAttempts(topicName, true, difficulty);
  }

  function incrementAttempts(
    topicName: string,
    isCorrect: boolean,
    difficulty: DifficultyLevel = "beginner"
  ) {
    // Update persistent store with difficulty
    const newGlobalStats = storeIncrementAttempt(
      topicName,
      isCorrect,
      difficulty
    );

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
