import "./quick-domain-manager.style.scss"
import { useComputed, useSignal } from "@preact/signals"
import { X } from "lucide-preact"
import { useEffect, useRef } from "preact/hooks"
import { createSwapy, Swapy, utils } from "swapy"
import { Logger } from "@/services/logger"
import { quickDomainsService } from "@/services/quick-domains-service"
import { QuickDomain } from "@/types"
import { QuickDomainFormModal } from "./quick-domain-form-modal"
import { QuickDomainRow } from "./quick-domain-row"

interface QuickDomainManagerProps {
    onClose: () => void
    onDomainSelect: (domain: string) => void
}

export const QuickDomainManager = ({
    onClose,
    onDomainSelect,
}: QuickDomainManagerProps) => {
    const domains = useSignal<QuickDomain[]>([])
    const loading = useSignal(true)
    const showForm = useSignal(false)
    const editingDomain = useSignal<QuickDomain | null>(null)
    const slotItemMap = useSignal<Array<{ slot: string; item: string }>>([])
    const slottedItems = useComputed(() =>
        utils.toSlottedItems(domains.value, "id", slotItemMap.value)
    )
    const swapyRef = useRef<Swapy | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedDomains =
                    await quickDomainsService.getQuickDomainsOrdered()
                domains.value = fetchedDomains
                slotItemMap.value = utils.initSlotItemMap(fetchedDomains, "id")
            } catch (error) {
                Logger.error("Failed to load domains:", error)
            } finally {
                loading.value = false
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        utils.dynamicSwapy(
            swapyRef.current,
            domains.value,
            "id",
            slotItemMap.value,
            (newSlotItemMap) => {
                slotItemMap.value = newSlotItemMap
            }
        )
    }, [domains.value])

    useEffect(() => {
        if (loading.value) return

        swapyRef.current = createSwapy(containerRef.current!, {
            manualSwap: true,
            animation: "spring",
            autoScrollOnDrag: true,
            dragAxis: "y",
        })

        swapyRef.current.onSwap((event) => {
            slotItemMap.value = event.newSlotItemMap.asArray
        })

        swapyRef.current.onSwapEnd(async (event) => {
            if (event.hasChanged) {
                try {
                    const newOrderedDomains = event.slotItemMap.asArray
                        .map(({ item }) => {
                            return domains.value.find((d) => d.id === item)
                        })
                        .filter(Boolean) as QuickDomain[]

                    const domainsWithNewSequence = newOrderedDomains.map(
                        (domain, index) => ({
                            ...domain,
                            sequence: index,
                        })
                    )

                    await quickDomainsService.setQuickDomainsOrdered(
                        domainsWithNewSequence
                    )
                } catch (error) {
                    Logger.error("Failed to save new order:", error)
                }
            }
        })

        return () => {
            swapyRef.current?.destroy()
        }
    }, [loading.value])

    const handleDelete = (domainId: string) => {
        domains.value = domains.value.filter((d) => d.id !== domainId)
        quickDomainsService.deleteQuickDomain(domainId).catch(Logger.error)
    }

    const handleAdd = () => {
        editingDomain.value = null
        showForm.value = true
    }

    const handleEdit = (domain: QuickDomain) => {
        editingDomain.value = domain
        showForm.value = true
    }

    const handleSave = async (domainData: { name: string; domain: string }) => {
        if (editingDomain.value) {
            const updatedDomain = {
                ...editingDomain.value,
                ...domainData,
            }
            domains.value = domains.value.map((d) =>
                d.id === editingDomain.value!.id ? updatedDomain : d
            )
            await quickDomainsService.updateQuickDomain(
                updatedDomain.id,
                updatedDomain
            )
        } else {
            const newDomain: QuickDomain = {
                id: `domain-${Date.now()}`,
                sequence: domains.value.length,
                ...domainData,
            }
            domains.value = [...domains.value, newDomain]
            await quickDomainsService.addQuickDomain(newDomain)
        }
        showForm.value = false
        editingDomain.value = null
    }

    const handleCancel = () => {
        showForm.value = false
        editingDomain.value = null
    }

    const handleDomainClick = (domain: string) => {
        onDomainSelect(domain)
        onClose()
    }

    if (loading.value) {
        return (
            <div
                className="quick-domain-manager-overlay"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose()
                }}
            >
                <div className="quick-domain-manager">
                    <div className="quick-domain-manager-header">
                        <h3>Quick Domain Manager - Loading</h3>
                        <button className="btn-close" onClick={onClose}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="quick-domain-manager-content">
                        <div className="loading">Loading domains...</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="quick-domain-manager-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="quick-domain-manager">
                <div className="quick-domain-manager-header">
                    <h3>Quick Domain Manager</h3>
                    <button className="btn-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="quick-domain-manager-actions">
                    <button onClick={handleAdd} className="btn btn-primary">
                        Add Domain
                    </button>
                </div>

                <div className="quick-domain-manager-content">
                    <div className="quick-domain-list" ref={containerRef}>
                        {slottedItems.value.map(
                            ({
                                slotId,
                                itemId,
                                item,
                            }: {
                                slotId: string
                                itemId: string
                                item: QuickDomain | null
                            }) =>
                                item && (
                                    <QuickDomainRow
                                        key={slotId}
                                        domain={item}
                                        slotId={slotId}
                                        itemId={itemId}
                                        onDomainClick={handleDomainClick}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                )
                        )}
                    </div>

                    {domains.value.length === 0 && (
                        <div className="quick-domain-empty">
                            <p>No domains found.</p>
                            <p>Click "Add Domain" to create one.</p>
                        </div>
                    )}

                    <QuickDomainFormModal
                        domain={editingDomain.value}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isOpen={showForm.value}
                    />
                </div>
            </div>
        </div>
    )
}
