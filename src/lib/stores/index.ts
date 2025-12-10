// Persisted state stores - import directly from individual modules
// @/lib/stores/statsStore - Stats tracking
// @/lib/stores/topicsStore - Topic/curriculum data
// @/lib/stores/settingsStore - User settings
// @/lib/stores/apiKeyStore - API key management
// @/lib/stores/apiUsageEntryStore - Usage entries
// @/lib/stores/usageStore - Usage tracking
// @/lib/stores/historyStore - Practice history

// Note: We don't use barrel exports here because statsStore and topicsStore
// both export getModuleStats() with different purposes. Import from the
// specific module you need.
