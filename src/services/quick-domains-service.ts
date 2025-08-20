import { StorageItemKey, storage, WatchCallback } from "wxt/utils/storage"
import { Logger } from "@/services/logger"
import { QuickDomain } from "@/types"
import { CHROME_STORAGE_QUICK_DOMAINS_KEY } from "@/utils/constants"

/**
 * Service for managing DevTools quick domains
 * Handles quick domain storage, ordering, and CRUD operations
 */
export class QuickDomainsService {
    private static instance: QuickDomainsService | null = null

    private quickDomainsSyncStorage = storage.defineItem<QuickDomain[]>(
        <StorageItemKey>`sync:${CHROME_STORAGE_QUICK_DOMAINS_KEY}`,
        {
            init: () => [
                {
                    id: "active-records",
                    name: "Active records",
                    domain: '[["active", "=", true]]',
                    sequence: 0,
                },
                {
                    id: "all-records",
                    name: "All records",
                    domain: "[]",
                    sequence: 1,
                },
            ],
            version: 1,
        }
    )

    static getInstance(): QuickDomainsService {
        if (!QuickDomainsService.instance) {
            QuickDomainsService.instance = new QuickDomainsService()
        }
        return QuickDomainsService.instance
    }

    // ===== CORE QUICK DOMAINS OPERATIONS =====

    /**
     * Get quick domains from local storage (unordered)
     */
    async getQuickDomains(): Promise<QuickDomain[]> {
        const domains = await storage.getItem<QuickDomain[]>(
            <StorageItemKey>`local:${CHROME_STORAGE_QUICK_DOMAINS_KEY}`
        )
        return domains || []
    }

    /**
     * Set quick domains to local storage
     */
    async setQuickDomains(domains: QuickDomain[]): Promise<void> {
        return storage.setItem(
            <StorageItemKey>`local:${CHROME_STORAGE_QUICK_DOMAINS_KEY}`,
            domains
        )
    }

    /**
     * Watch for quick domains changes
     */
    watchQuickDomains(
        callback: WatchCallback<QuickDomain[] | null>
    ): () => void {
        return storage.watch<QuickDomain[]>(
            <StorageItemKey>`local:${CHROME_STORAGE_QUICK_DOMAINS_KEY}`,
            callback
        )
    }

    /**
     * Watch for quick domains changes with automatic ordering
     */
    watchQuickDomainsOrdered(
        callback: WatchCallback<QuickDomain[] | null>
    ): () => void {
        return storage.watch<QuickDomain[]>(
            <StorageItemKey>`local:${CHROME_STORAGE_QUICK_DOMAINS_KEY}`,
            (newValue, oldValue) => {
                // Always sort by sequence before calling callback
                const sortedNewValue =
                    newValue?.toSorted((a, b) => a.sequence - b.sequence) ||
                    null
                const sortedOldValue =
                    oldValue?.toSorted((a, b) => a.sequence - b.sequence) ||
                    null
                callback(sortedNewValue, sortedOldValue)
            }
        )
    }

    // ===== ORDERED QUICK DOMAINS OPERATIONS =====

    /**
     * Get quick domains ordered by sequence
     */
    async getQuickDomainsOrdered(): Promise<QuickDomain[]> {
        const domains = await this.getQuickDomains()
        return domains.toSorted((a, b) => a.sequence - b.sequence)
    }

    /**
     * Set quick domains with deduplication and ordering
     */
    async setQuickDomainsOrdered(domains: QuickDomain[]): Promise<void> {
        // Remove duplicates by ID (keep latest)
        const uniqueDomains = Object.values(
            domains.reduce((acc: { [key: string]: QuickDomain }, obj) => {
                acc[obj.id] = obj
                return acc
            }, {})
        )

        // Sort by sequence after deduplication
        const sortedDomains = uniqueDomains.toSorted(
            (a, b) => a.sequence - b.sequence
        )

        return this.setQuickDomains(sortedDomains)
    }

    // ===== CRUD OPERATIONS =====

    /**
     * Add a new quick domain
     */
    async addQuickDomain(domain: Omit<QuickDomain, "sequence">): Promise<void> {
        const domains = await this.getQuickDomainsOrdered()

        // Check if ID already exists
        if (domains.some((d) => d.id === domain.id)) {
            throw new Error(
                `Quick domain with ID "${domain.id}" already exists`
            )
        }

        const newDomain: QuickDomain = {
            ...domain,
            sequence: domains.length,
        }

        return this.setQuickDomainsOrdered([newDomain, ...domains])
    }

    /**
     * Update an existing quick domain
     */
    async updateQuickDomain(
        domainId: string,
        updates: Partial<Omit<QuickDomain, "id">>
    ): Promise<void> {
        const domains = await this.getQuickDomainsOrdered()
        const domainExists = domains.some((d) => d.id === domainId)

        if (!domainExists) {
            throw new Error(`Quick domain with ID "${domainId}" not found`)
        }

        const updatedDomains = domains.map((domain) => {
            if (domain.id === domainId) {
                return { ...domain, ...updates }
            }
            return domain
        })

        return this.setQuickDomainsOrdered(updatedDomains)
    }

    /**
     * Delete a quick domain
     */
    async deleteQuickDomain(domainId: string): Promise<void> {
        const domains = await this.getQuickDomainsOrdered()
        const updatedDomains = domains.filter(
            (domain) => domain.id !== domainId
        )

        if (updatedDomains.length === domains.length) {
            Logger.warn(
                `Quick domain with ID "${domainId}" not found for deletion`
            )
            return
        }

        return this.setQuickDomainsOrdered(updatedDomains)
    }

    /**
     * Get quick domain by ID
     */
    async getQuickDomainById(domainId: string): Promise<QuickDomain | null> {
        const domains = await this.getQuickDomainsOrdered()
        return domains.find((d) => d.id === domainId) || null
    }

    /**
     * Reorder quick domains by updating sequences
     */
    async reorderQuickDomains(orderedDomains: QuickDomain[]): Promise<void> {
        const domainsWithSequence = orderedDomains.map((domain, index) => ({
            ...domain,
            sequence: index,
        }))
        return this.setQuickDomainsOrdered(domainsWithSequence)
    }

    /**
     * Generate unique ID for new domain
     */
    async generateUniqueId(baseName: string): Promise<string> {
        const domains = await this.getQuickDomainsOrdered()
        const baseId = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-")

        let id = baseId
        let counter = 1

        while (domains.some((d) => d.id === id)) {
            id = `${baseId}-${counter}`
            counter++
        }

        return id
    }

    // ===== SYNC OPERATIONS =====

    /**
     * Get quick domains from sync storage
     */
    async getSyncedQuickDomains(): Promise<QuickDomain[]> {
        return this.quickDomainsSyncStorage.getValue()
    }

    /**
     * Save quick domains to sync storage
     */
    async persistQuickDomainsToSync(): Promise<void> {
        const domains = await this.getQuickDomainsOrdered()
        await this.quickDomainsSyncStorage.setValue(domains)
    }

    /**
     * Align local quick domains with synced domains
     */
    async alignLocalQuickDomainsWithSync(): Promise<void> {
        Logger.info("Aligning local quick domains with cloud data")
        const syncedDomains = await this.getSyncedQuickDomains()
        await this.setQuickDomains(syncedDomains)
        Logger.info("Local quick domains aligned with cloud data")
    }

    // ===== CONFIGURATION IMPORT/EXPORT =====

    /**
     * Export current quick domains for backup
     */
    async exportQuickDomains(): Promise<QuickDomain[]> {
        return this.getQuickDomainsOrdered()
    }

    /**
     * Import quick domains from backup
     */
    async importQuickDomains(domains: QuickDomain[]): Promise<void> {
        Logger.info("Importing quick domains from configuration")
        await this.setQuickDomainsOrdered(domains)
        Logger.info("Quick domains imported successfully")
    }
}

export const quickDomainsService = QuickDomainsService.getInstance()
