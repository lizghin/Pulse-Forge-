// Analytics Module - Minimal instrumentation for gameplay tuning
// Uses expo-constants for version info (web-compatible)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Types
export interface RunEndEvent {
  type: 'run_end';
  score: number;
  duration: number;
  segment_reached: number;
  death_cause: string | null;
  perfect_count: number;
  near_miss_count: number;
  blueprints_earned_total: number;
}

export interface UpgradeSelectedEvent {
  type: 'upgrade_selected';
  upgrade_id: string;
  rarity: string;
  category: string;
}

export interface BlueprintSpentEvent {
  type: 'blueprint_spent';
  item_type: string;
  item_id: string;
  cost: number;
}

type AnalyticsEvent = RunEndEvent | UpgradeSelectedEvent | BlueprintSpentEvent;

interface QueuedEvent {
  event: AnalyticsEvent;
  player_id: string;
  session_id: string;
  run_id: string | null;
  ts: string;
  app_version: string;
  platform: string;
}

// Constants
const QUEUE_KEY = '@pulse_forge_analytics_queue';
const PLAYER_ID_KEY = '@pulse_forge_player_id';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const INGESTION_KEY = 'pulse-forge-ingest-key-2024';

// State
let playerId: string | null = null;
let sessionId: string | null = null;
let currentRunId: string | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;

// Generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get app version from expo-constants (web-safe)
function getAppVersion(): string {
  try {
    // Try expoConfig first (works on all platforms)
    const version = Constants.expoConfig?.version;
    if (version) return version;
    
    // Fallback to manifest (older expo versions)
    const manifest = Constants.manifest;
    if (manifest?.version) return manifest.version;
    
    return 'dev';
  } catch {
    return 'dev';
  }
}

// Get platform
function getPlatform(): string {
  return Platform.OS;
}

// Initialize analytics
export async function initAnalytics(): Promise<void> {
  try {
    // Get or create player ID
    let storedPlayerId = await AsyncStorage.getItem(PLAYER_ID_KEY);
    if (!storedPlayerId) {
      storedPlayerId = generateUUID();
      await AsyncStorage.setItem(PLAYER_ID_KEY, storedPlayerId);
    }
    playerId = storedPlayerId;
    
    // Create session ID
    sessionId = generateUUID();
    
    // Start flush timer
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(flushQueue, FLUSH_INTERVAL);
    
    console.log('[Analytics] Initialized. Player:', playerId?.slice(0, 8), 'Version:', getAppVersion());
  } catch (error) {
    console.error('[Analytics] Init error:', error);
  }
}

// Start a new run
export function startRun(): string {
  currentRunId = generateUUID();
  console.log('[Analytics] Run started:', currentRunId?.slice(0, 8));
  return currentRunId;
}

// End current run
export function endRun(): void {
  currentRunId = null;
}

// Track event
export async function track(event: AnalyticsEvent): Promise<void> {
  if (!playerId || !sessionId) {
    console.warn('[Analytics] Not initialized, skipping event:', event.type);
    return;
  }
  
  const queuedEvent: QueuedEvent = {
    event,
    player_id: playerId,
    session_id: sessionId,
    run_id: currentRunId,
    ts: new Date().toISOString(),
    app_version: getAppVersion(),
    platform: getPlatform(),
  };
  
  try {
    // Add to queue
    const queue = await getQueue();
    queue.push(queuedEvent);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    console.log('[Analytics] Queued event:', event.type, '| Queue size:', queue.length);
    
    // Flush if batch size reached
    if (queue.length >= BATCH_SIZE) {
      console.log('[Analytics] Batch size reached, triggering flush');
      await flushQueue();
    }
  } catch (error) {
    console.error('[Analytics] Queue error:', error);
  }
}

// Get current queue
async function getQueue(): Promise<QueuedEvent[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Flush queue to server
export async function flushQueue(): Promise<void> {
  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      console.log('[Analytics] Queue empty, nothing to flush');
      return;
    }
    
    const url = `${API_URL}/api/analytics/events/batch`;
    console.log('[Analytics] Flushing', queue.length, 'events to:', url);
    console.log('[Analytics] First event:', JSON.stringify(queue[0]?.event));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INGESTION_KEY,
      },
      body: JSON.stringify({ events: queue }),
    });
    
    if (response.ok) {
      // Clear queue on success
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
      const result = await response.json();
      console.log('[Analytics] Flush successful:', result);
    } else {
      const errorText = await response.text();
      console.error('[Analytics] Flush failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('[Analytics] Flush error:', error);
    // Keep events in queue for retry
  }
}

// Convenience methods
export const Analytics = {
  init: initAnalytics,
  startRun,
  endRun,
  track,
  flush: flushQueue,
  
  // Track run end
  trackRunEnd: (data: Omit<RunEndEvent, 'type'>) => 
    track({ type: 'run_end', ...data }),
  
  // Track upgrade selection
  trackUpgradeSelected: (data: Omit<UpgradeSelectedEvent, 'type'>) =>
    track({ type: 'upgrade_selected', ...data }),
  
  // Track blueprint spent
  trackBlueprintSpent: (data: Omit<BlueprintSpentEvent, 'type'>) =>
    track({ type: 'blueprint_spent', ...data }),
};

export default Analytics;
