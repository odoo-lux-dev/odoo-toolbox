import { StorageItemKey, storage, WatchCallback } from "wxt/utils/storage"
import { Logger } from "@/services/logger"
import { Favorite, FavoritesV1, FavoritesV2, FavoritesV3 } from "@/types"
import { CHROME_STORAGE_FAVORITES_KEY } from "@/utils/constants"

/**
 * Service for managing Odoo.SH project favorites
 * Handles favorites storage, ordering, and business logic
 */
export class FavoritesService {
    private static instance: FavoritesService | null = null

    private favoritesSyncStorage = storage.defineItem<Favorite[]>(
        <StorageItemKey>`sync:${CHROME_STORAGE_FAVORITES_KEY}`,
        {
            init: () => [],
            version: 3,
            migrations: {
                2: (favorites: FavoritesV1[]): FavoritesV2[] => {
                    return favorites.toSorted().map((favorite, index) => ({
                        name: favorite,
                        display_name: favorite,
                        sequence: index,
                    }))
                },
                3: (favorites: FavoritesV2[]): FavoritesV3[] => {
                    return favorites.map((favorite) => ({
                        ...favorite,
                        task_link: "",
                    }))
                },
            },
        }
    )

    static getInstance(): FavoritesService {
        if (!FavoritesService.instance) {
            FavoritesService.instance = new FavoritesService()
        }
        return FavoritesService.instance
    }

    // ===== CORE FAVORITES OPERATIONS =====

    /**
     * Get favorites from local storage (unordered)
     */
    async getFavorites(): Promise<Favorite[]> {
        const favorites = await storage.getItem<Favorite[]>(
            <StorageItemKey>`local:${CHROME_STORAGE_FAVORITES_KEY}`
        )
        return favorites || []
    }

    /**
     * Set favorites to local storage
     */
    async setFavorites(favorites: Favorite[]): Promise<void> {
        return storage.setItem(
            <StorageItemKey>`local:${CHROME_STORAGE_FAVORITES_KEY}`,
            favorites
        )
    }

    /**
     * Watch for favorites changes
     */
    watchFavorites(callback: WatchCallback<Favorite[] | null>): () => void {
        return storage.watch<Favorite[]>(
            <StorageItemKey>`local:${CHROME_STORAGE_FAVORITES_KEY}`,
            callback
        )
    }

    // ===== ORDERED FAVORITES OPERATIONS =====

    /**
     * Get favorites ordered by sequence
     */
    async getFavoritesProjects(): Promise<Favorite[]> {
        const projects = await this.getFavorites()
        return projects.toSorted((a, b) => a.sequence - b.sequence)
    }

    /**
     * Set favorites with deduplication and ordering
     */
    async setFavoritesProjects(projects: Favorite[]): Promise<void> {
        // Remove duplicates by name (keep latest)
        const deduplicatedProjects = Object.values(
            projects.reduce((acc: { [key: string]: Favorite }, obj) => {
                acc[obj.name] = obj
                return acc
            }, {})
        )
        return this.setFavorites(deduplicatedProjects)
    }

    // ===== BUSINESS OPERATIONS =====

    /**
     * Add a project to favorites
     */
    async addToFavorites(projectToAdd: string): Promise<void> {
        const favorites = await this.getFavoritesProjects()

        // Check if already exists
        if (favorites.some((fav) => fav.name === projectToAdd)) {
            Logger.info(`Project ${projectToAdd} is already in favorites`)
            return
        }

        const newFavorite: Favorite = {
            name: projectToAdd,
            display_name: projectToAdd,
            sequence: favorites.length,
            task_link: "",
        }

        return this.setFavoritesProjects([newFavorite, ...favorites])
    }

    /**
     * Remove a project from favorites
     */
    async deleteFromFavorites(projectToDelete: string): Promise<void> {
        const favorites = await this.getFavoritesProjects()
        const updatedFavorites = favorites.filter(
            (favorite) => favorite.name !== projectToDelete
        )
        return this.setFavoritesProjects(updatedFavorites)
    }

    /**
     * Rename a favorite project display name
     */
    async renameFavorite(
        favoriteId: string,
        newDisplayName: string
    ): Promise<void> {
        const favorites = await this.getFavoritesProjects()
        const updatedFavorites = favorites.map((favorite) => {
            if (favorite.name === favoriteId) {
                return { ...favorite, display_name: newDisplayName }
            }
            return favorite
        })
        return this.setFavoritesProjects(updatedFavorites)
    }

    /**
     * Set task URL for a specific project
     */
    async setProjectTaskUrl(
        projectName: string,
        taskUrl: string
    ): Promise<void> {
        const favorites = await this.getFavoritesProjects()
        const updatedFavorites = favorites.map((favorite) => {
            if (favorite.name === projectName) {
                return { ...favorite, task_link: taskUrl }
            }
            return favorite
        })
        return this.setFavoritesProjects(updatedFavorites)
    }

    /**
     * Reorder favorites by updating sequences
     */
    async reorderFavorites(orderedFavorites: Favorite[]): Promise<void> {
        const favoritesWithSequence = orderedFavorites.map(
            (favorite, index) => ({
                ...favorite,
                sequence: index,
            })
        )
        return this.setFavoritesProjects(favoritesWithSequence)
    }

    /**
     * Check if a project is in favorites
     */
    async isProjectFavorite(projectName: string): Promise<boolean> {
        const favorites = await this.getFavoritesProjects()
        return favorites.some((fav) => fav.name === projectName)
    }

    /**
     * Get favorite by project name
     */
    async getFavoriteByName(projectName: string): Promise<Favorite | null> {
        const favorites = await this.getFavoritesProjects()
        return favorites.find((fav) => fav.name === projectName) || null
    }

    // ===== SYNC OPERATIONS =====

    /**
     * Get favorites from sync storage
     */
    async getSyncedFavorites(): Promise<Favorite[]> {
        return this.favoritesSyncStorage.getValue()
    }

    /**
     * Save favorites to sync storage
     */
    async persistFavoritesToSync(): Promise<void> {
        const favorites = await this.getFavoritesProjects()
        await this.favoritesSyncStorage.setValue(favorites)
    }

    /**
     * Align local favorites with synced favorites
     */
    async alignLocalFavoritesWithSync(): Promise<void> {
        Logger.info("Aligning local favorites with cloud data")
        const syncedFavorites = await this.getSyncedFavorites()
        await this.setFavorites(syncedFavorites)
        Logger.info("Local favorites aligned with cloud data")
    }

    // ===== CONFIGURATION IMPORT/EXPORT =====

    /**
     * Export current favorites for backup
     */
    async exportFavorites(): Promise<Favorite[]> {
        return this.getFavoritesProjects()
    }

    /**
     * Import favorites from backup
     */
    async importFavorites(favorites: Favorite[]): Promise<void> {
        Logger.info("Importing favorites from configuration")
        await this.setFavoritesProjects(favorites)
        Logger.info("Favorites imported successfully")
    }
}

// Export singleton instance
export const favoritesService = FavoritesService.getInstance()
