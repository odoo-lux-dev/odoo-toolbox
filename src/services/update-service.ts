import { MAJOR_UPDATES } from "@/services/updates-changelog"
import type { UpdateConfig } from "@/types"

/**
 * Service for managing application updates
 * Handles version comparison, update notifications, and update information
 */
export class UpdateService {
    private static instance: UpdateService | null = null

    static getInstance(): UpdateService {
        if (!UpdateService.instance) {
            UpdateService.instance = new UpdateService()
        }
        return UpdateService.instance
    }

    /**
     * Compares two semantic version strings
     * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
     */
    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split(".").map(Number)
        const parts2 = v2.split(".").map(Number)

        const maxLength = Math.max(parts1.length, parts2.length)

        for (let i = 0; i < maxLength; i++) {
            const part1 = parts1[i] || 0
            const part2 = parts2[i] || 0

            if (part1 < part2) return -1
            if (part1 > part2) return 1
        }

        return 0
    }

    /**
     * Finds the most recent update page to show based on version range
     * Checks all versions between previousVersion and currentVersion
     */
    shouldShowUpdatePage(
        currentVersion: string,
        previousVersion: string
    ): boolean {
        // Find all major updates that should be shown and fall within the version range
        const relevantUpdates = MAJOR_UPDATES.filter((update) => {
            const isAfterPrevious =
                this.compareVersions(update.version, previousVersion) > 0
            const isBeforeOrEqualCurrent =
                this.compareVersions(update.version, currentVersion) <= 0
            return (
                update.shouldShowUpdatePage &&
                isAfterPrevious &&
                isBeforeOrEqualCurrent
            )
        })

        return relevantUpdates.length > 0
    }

    /**
     * Gets complete update information for display
     */
    getUpdateInfo(currentVersion: string): {
        notes: string[]
        updateVersion?: string
        title?: string
        description?: string
        mainFeature?: UpdateConfig["mainFeature"]
        activationMethods?: UpdateConfig["activationMethods"]
        customSections?: UpdateConfig["customSections"]
    } {
        // Find all versions with update pages that are ≤ current version
        const eligibleUpdates = MAJOR_UPDATES.filter((update) => {
            return (
                update.shouldShowUpdatePage &&
                this.compareVersions(update.version, currentVersion) <= 0
            )
        })

        if (eligibleUpdates.length === 0) {
            return { notes: [] }
        }

        // Sort by version and get the most recent one
        eligibleUpdates.sort((a, b) =>
            this.compareVersions(b.version, a.version)
        )
        const mostRecentUpdate = eligibleUpdates[0]

        return {
            notes: mostRecentUpdate.releaseNotes || [],
            updateVersion: mostRecentUpdate.version,
            title: mostRecentUpdate.title,
            description: mostRecentUpdate.description,
            mainFeature: mostRecentUpdate.mainFeature,
            activationMethods: mostRecentUpdate.activationMethods,
            customSections: mostRecentUpdate.customSections,
        }
    }

    /**
     * Get all major updates
     */
    getAllMajorUpdates() {
        return MAJOR_UPDATES
    }

    /**
     * Get updates within a version range
     */
    getUpdatesInRange(fromVersion: string, toVersion: string) {
        return MAJOR_UPDATES.filter((update) => {
            const isAfterFrom =
                this.compareVersions(update.version, fromVersion) > 0
            const isBeforeOrEqualTo =
                this.compareVersions(update.version, toVersion) <= 0
            return isAfterFrom && isBeforeOrEqualTo
        })
    }

    /**
     * Check if a specific version should show update page
     */
    shouldVersionShowUpdatePage(version: string): boolean {
        const update = MAJOR_UPDATES.find((u) => u.version === version)
        return update?.shouldShowUpdatePage ?? false
    }
}

// Export singleton instance
export const updateService = UpdateService.getInstance()
