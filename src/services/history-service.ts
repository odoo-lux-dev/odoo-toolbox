import { StorageItemKey, storage } from "wxt/utils/storage";
import type {
    CreateHistoryActionParams,
    HistoryAction,
    HistoryActionType,
} from "@/types";
import { Logger } from "./logger";

const HISTORY_STORAGE_KEY = "devtools_history";
const MAX_HISTORY_ENTRIES = 100;

/**
 * Service for managing DevTools action history
 * Stores the last 100 actions performed through DevTools
 */
export class HistoryService {
    private static instance: HistoryService | null = null;

    private historyStorage = storage.defineItem<HistoryAction[]>(
        <StorageItemKey>`local:${HISTORY_STORAGE_KEY}`,
        {
            init: () => [],
            version: 1,
        },
    );

    static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService();
        }
        return HistoryService.instance;
    }

    /**
     * Add a new action to history
     */
    async addAction<T extends HistoryActionType>(
        actionParams: CreateHistoryActionParams<T>,
    ): Promise<void> {
        try {
            const history = await this.getHistory();

            const newAction: HistoryAction = {
                ...actionParams,
                id: this.generateId(),
                timestamp: Date.now(),
            } as HistoryAction;

            // Add to beginning of array (newest first)
            history.unshift(newAction);

            // Keep only the last MAX_HISTORY_ENTRIES
            const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);

            await this.historyStorage.setValue(trimmedHistory);
        } catch (error) {
            Logger.error("Failed to add action to history:", error);
        }
    }

    /**
     * Get all history actions
     */
    async getHistory(): Promise<HistoryAction[]> {
        try {
            return await this.historyStorage.getValue();
        } catch (error) {
            Logger.error("Failed to load history:", error);
            return [];
        }
    }

    /**
     * Clear all history
     */
    async clearHistory(): Promise<void> {
        try {
            await this.historyStorage.setValue([]);
        } catch (error) {
            Logger.error("Failed to clear history:", error);
        }
    }

    /**
     * Remove a specific action from history
     */
    async removeAction(actionId: string): Promise<void> {
        try {
            const history = await this.getHistory();
            const filteredHistory = history.filter(
                (action) => action.id !== actionId,
            );
            await this.historyStorage.setValue(filteredHistory);
        } catch (error) {
            Logger.error("Failed to remove action from history:", error);
        }
    }

    /**
     * Get actions by type
     */
    async getActionsByType(type: HistoryActionType): Promise<HistoryAction[]> {
        const history = await this.getHistory();
        return history.filter((action) => action.type === type);
    }

    /**
     * Get actions by model
     */
    async getActionsByModel(model: string): Promise<HistoryAction[]> {
        const history = await this.getHistory();
        return history.filter((action) => action.model === model);
    }

    /**
     * Watch for history changes
     */
    watchHistory(callback: (history: HistoryAction[]) => void): () => void {
        return storage.watch<HistoryAction[]>(
            <StorageItemKey>`local:${HISTORY_STORAGE_KEY}`,
            (newValue) => {
                callback(newValue || []);
            },
        );
    }

    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Convenience functions for easy access
export const historyService = HistoryService.getInstance();

export const addHistoryAction = <T extends HistoryActionType>(
    actionParams: CreateHistoryActionParams<T>,
) => historyService.addAction(actionParams);

export const getHistory = () => historyService.getHistory();
export const clearHistory = () => historyService.clearHistory();
export const removeHistoryAction = (actionId: string) =>
    historyService.removeAction(actionId);
export const getHistoryByType = (type: HistoryActionType) =>
    historyService.getActionsByType(type);
export const getHistoryByModel = (model: string) =>
    historyService.getActionsByModel(model);
export const watchHistory = (callback: (history: HistoryAction[]) => void) =>
    historyService.watchHistory(callback);
