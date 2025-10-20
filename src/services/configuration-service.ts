import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import { settingsService } from "@/services/settings-service";
import type { Favorite, QuickDomain, StoredSettings } from "@/types";

/**
 * Service for managing global configuration sync between local and cloud storage
 * Coordinates settings, favorites, and quick domains synchronization
 */
export class ConfigurationService {
    private static instance: ConfigurationService | null = null;

    static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }

    // ===== GLOBAL SYNC OPERATIONS =====

    /**
     * Retrieve all synced data from cloud storage
     */
    async retrieveSyncedData(): Promise<{
        favorites: Favorite[];
        settings: StoredSettings;
        quickDomains: QuickDomain[];
    }> {
        const [favorites, settings, quickDomains] = await Promise.all([
            favoritesService.getSyncedFavorites(),
            settingsService.getSyncedSettings(),
            quickDomainsService.getSyncedQuickDomains(),
        ]);

        return { favorites, settings, quickDomains };
    }

    /**
     * Update all local data with provided configuration
     */
    async updateLocalData(
        favorites: Favorite[],
        settings: StoredSettings,
        quickDomains: QuickDomain[],
    ): Promise<void> {
        await Promise.all([
            favoritesService.setFavorites(favorites),
            settingsService.setSettings(settings),
            quickDomainsService.setQuickDomains(quickDomains),
        ]);
    }

    /**
     * Align all local data with synced data from cloud
     */
    async alignLocalDataWithSyncedData(): Promise<void> {
        Logger.info("Aligning local data with cloud data");

        try {
            const { favorites, settings, quickDomains } =
                await this.retrieveSyncedData();
            await this.updateLocalData(favorites, settings, quickDomains);
            Logger.info("Local data aligned with cloud data");
        } catch (error) {
            Logger.error("Failed to align local data with cloud data", error);
            throw error;
        }
    }

    /**
     * Persist all local data to sync storage
     */
    async persistDataToSync(): Promise<void> {
        Logger.info("Persisting local data to cloud storage");

        try {
            await Promise.all([
                favoritesService.persistFavoritesToSync(),
                settingsService.persistSettingsToSync(),
                quickDomainsService.persistQuickDomainsToSync(),
            ]);
            Logger.info("Local data persisted to cloud storage");
        } catch (error) {
            Logger.error("Failed to persist data to cloud storage", error);
            throw error;
        }
    }

    // ===== CONFIGURATION IMPORT/EXPORT =====

    /**
     * Export complete configuration for backup
     */
    async exportConfiguration(): Promise<{
        settings: StoredSettings;
        favorites: Favorite[];
        quickDomains: QuickDomain[];
    }> {
        Logger.info("Exporting complete configuration");

        const [settings, favorites, quickDomains] = await Promise.all([
            settingsService.exportSettings(),
            favoritesService.exportFavorites(),
            quickDomainsService.exportQuickDomains(),
        ]);

        Logger.info("Configuration exported successfully");
        return { settings, favorites, quickDomains };
    }

    /**
     * Import configuration from backup with selective update
     */
    async importConfiguration(data: {
        settings?: StoredSettings;
        favorites?: Favorite[];
        quickDomains?: QuickDomain[];
    }): Promise<void> {
        Logger.info("Importing configuration from file");

        const importPromises: Promise<void>[] = [];

        if (data.settings) {
            importPromises.push(settingsService.importSettings(data.settings));
        }

        if (data.favorites) {
            importPromises.push(
                favoritesService.importFavorites(data.favorites),
            );
        }

        if (data.quickDomains) {
            importPromises.push(
                quickDomainsService.importQuickDomains(data.quickDomains),
            );
        }

        try {
            await Promise.all(importPromises);
            await this.persistDataToSync();
            Logger.info("Configuration imported and synced to cloud");
        } catch (error) {
            Logger.error("Failed to import configuration", error);
            throw error;
        }
    }

    /**
     * Reset all configuration to defaults
     */
    async resetToDefaults(): Promise<void> {
        Logger.warn("Resetting all configuration to defaults");

        try {
            // Get default settings
            const defaultSettings = settingsService.getDefaultSettings();

            // Import empty/default configuration
            await this.importConfiguration({
                settings: defaultSettings,
                favorites: [],
                quickDomains: [], // Will use storage defaults
            });
            Logger.info("Configuration reset to defaults");
        } catch (error) {
            Logger.error("Failed to reset configuration", error);
            throw error;
        }
    }

    // ===== VALIDATION HELPERS =====

    /**
     * Validate configuration data structure
     */
    validateConfiguration(data: {
        settings?: unknown;
        favorites?: unknown;
        quickDomains?: unknown;
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate settings structure
        if (data.settings && typeof data.settings !== "object") {
            errors.push("Settings must be an object");
        }

        // Validate favorites structure
        if (data.favorites) {
            if (!Array.isArray(data.favorites)) {
                errors.push("Favorites must be an array");
            } else {
                data.favorites.forEach((fav: unknown, index: number) => {
                    if (typeof fav !== "object" || fav === null) {
                        errors.push(
                            `Invalid favorite at index ${index}: must be an object`,
                        );
                        return;
                    }
                    const favObj = fav as Record<string, unknown>;
                    if (
                        !favObj.name ||
                        !favObj.display_name ||
                        typeof favObj.sequence !== "number"
                    ) {
                        errors.push(
                            `Invalid favorite at index ${index}: missing required fields`,
                        );
                    }
                });
            }
        }

        // Validate quick domains structure
        if (data.quickDomains) {
            if (!Array.isArray(data.quickDomains)) {
                errors.push("Quick domains must be an array");
            } else {
                data.quickDomains.forEach((domain: unknown, index: number) => {
                    if (typeof domain !== "object" || domain === null) {
                        errors.push(
                            `Invalid quick domain at index ${index}: must be an object`,
                        );
                        return;
                    }
                    const domainObj = domain as Record<string, unknown>;
                    if (
                        !domainObj.id ||
                        !domainObj.name ||
                        !domainObj.domain ||
                        typeof domainObj.sequence !== "number"
                    ) {
                        errors.push(
                            `Invalid quick domain at index ${index}: missing required fields`,
                        );
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

// Export singleton instance
export const configurationService = ConfigurationService.getInstance();
