import type { SQLiteBindParams, SQLiteRunResult } from 'expo-sqlite';

/**
 * Minimal async subset of expo-sqlite's SQLiteDatabase required by our data layer.
 * Real SQLiteDatabase instances satisfy this interface structurally, while tests
 * can inject lightweight in-memory stubs without native module coupling.
 */
export interface SQLiteExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SQLiteBindParams): Promise<SQLiteRunResult>;
  getFirstAsync<T>(source: string): Promise<T | null>;
  getAllAsync<T>(source: string, params: SQLiteBindParams): Promise<T[]>;
}
