import { useComputed, useSignal } from "@preact/signals"
import { Settings } from "lucide-preact"
import { useEffect, useLayoutEffect, useRef } from "preact/hooks"
import { loadingSignal } from "@/contexts/devtools-signals"
import { Logger } from "@/services/logger"
import { quickDomainsService } from "@/services/quick-domains-service"
import { QuickDomain } from "@/types"
import { QuickDomainManager } from "./quick-domain-manager"

interface QuickDomainButtonsProps {
    onDomainSelect: (domain: string) => void
}

/**
 * Dynamic quick domain buttons component
 * Shows domain buttons based on available space with overflow management
 */
export const QuickDomainButtons = ({
    onDomainSelect,
}: QuickDomainButtonsProps) => {
    const domains = useSignal<QuickDomain[]>([])
    const loading = useSignal(true)
    const showManager = useSignal(false)
    const maxVisible = useSignal(3)
    const containerRef = useRef<HTMLDivElement>(null)
    const measurementRef = useRef<HTMLDivElement>(null)

    const visibleDomains = useComputed(() =>
        domains.value.slice(0, maxVisible.value)
    )
    const hiddenCount = useComputed(() =>
        Math.max(0, domains.value.length - maxVisible.value)
    )
    const showOverflowButton = useComputed(() => hiddenCount.value > 0)

    useEffect(() => {
        loadDomains()

        const unwatch = quickDomainsService.watchQuickDomainsOrdered(
            (newDomains) => {
                if (newDomains) {
                    domains.value = newDomains
                    calculateMaxVisible()
                }
            }
        )

        return unwatch
    }, [])

    // Calculate how many buttons can fit in the available space
    useLayoutEffect(() => {
        calculateMaxVisible()

        // Recalculate on window resize
        const handleResize = () => setTimeout(() => calculateMaxVisible(), 100)
        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [domains.value])

    const calculateMaxVisible = () => {
        if (
            !containerRef.current ||
            !measurementRef.current ||
            domains.value.length === 0
        ) {
            return
        }

        const container = containerRef.current
        const measurement = measurementRef.current
        const containerWidth = container.offsetWidth

        if (containerWidth === 0) {
            return
        }

        measurement.innerHTML = ""
        measurement.style.visibility = "hidden"
        measurement.style.position = "absolute"
        measurement.style.display = "flex"
        measurement.style.gap = "8px"
        measurement.style.whiteSpace = "nowrap"

        let totalWidth = 0
        let maxCount = 0

        for (let i = 0; i < domains.value.length; i++) {
            const domain = domains.value[i]
            const button = document.createElement("button")
            button.className = "quick-domain-btn"
            button.textContent = domain.name
            button.style.visibility = "hidden"
            measurement.appendChild(button)

            const buttonWidth = button.offsetWidth
            const gapWidth = i > 0 ? 8 : 0 // Add gap except for first
            const newTotalWidth = totalWidth + buttonWidth + gapWidth

            // Reserve space for overflow/manage button
            const reservedSpace = 50

            if (newTotalWidth + reservedSpace <= containerWidth) {
                totalWidth = newTotalWidth
                maxCount = i + 1
            } else {
                break
            }
        }

        // Ensure at least 1 button is visible if we have domains and enough space
        if (maxCount === 0 && domains.value.length > 0) {
            // Check if we can fit at least one button + manage button
            const firstButton = document.createElement("button")
            firstButton.className = "quick-domain-btn"
            firstButton.textContent = domains.value[0].name
            measurement.appendChild(firstButton)

            if (firstButton.offsetWidth + 50 <= containerWidth) {
                maxCount = 1
            }
        }

        maxVisible.value = maxCount
        measurement.innerHTML = ""
    }

    const loadDomains = async () => {
        try {
            const fetchedDomains =
                await quickDomainsService.getQuickDomainsOrdered()
            domains.value = fetchedDomains
        } catch (error) {
            Logger.error("Failed to load quick domains:", error)
        } finally {
            loading.value = false
        }
    }

    const handleDomainClick = (domain: string) => {
        onDomainSelect(domain)
    }

    const handleOverflowClick = () => {
        showManager.value = true
    }

    const handleManagerClose = () => {
        showManager.value = false
    }

    if (loading.value) {
        return (
            <div className="quick-domain-section">
                <div className="quick-domain-header">
                    <div className="quick-actions-label">Quick domains:</div>
                    <button
                        type="button"
                        className="quick-domain-btn quick-domain-manage"
                        onClick={handleOverflowClick}
                        title="Manage domains"
                    >
                        <Settings size={14} />
                    </button>
                </div>
                <div className="quick-actions-buttons">
                    <div className="quick-domain-loading">
                        Loading domains...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="quick-domain-section">
                <div className="quick-domain-header">
                    <div className="quick-actions-label">Quick domains:</div>
                    <button
                        type="button"
                        className="quick-domain-btn quick-domain-manage"
                        onClick={handleOverflowClick}
                        title="Manage domains"
                        disabled={loadingSignal.value}
                    >
                        <Settings size={14} />
                    </button>
                </div>

                <div className="quick-actions-buttons" ref={containerRef}>
                    {visibleDomains.value.length > 0 ? (
                        visibleDomains.value.map((domain) => (
                            <button
                                key={domain.id}
                                type="button"
                                className="quick-domain-btn"
                                onClick={() => handleDomainClick(domain.domain)}
                                title={`Domain: ${domain.domain}`}
                                disabled={loadingSignal.value}
                            >
                                {domain.name}
                            </button>
                        ))
                    ) : (
                        <span className="quick-actions-label">
                            No quick domains available. You can create them by
                            clicking on the gear.
                        </span>
                    )}

                    {showOverflowButton.value && (
                        <button
                            type="button"
                            className="quick-domain-btn quick-domain-overflow"
                            onClick={handleOverflowClick}
                            title={`Show ${hiddenCount.value} more domains`}
                            disabled={loadingSignal.value}
                        >
                            +{hiddenCount.value}
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={measurementRef}
                className="quick-actions-buttons"
                style={{
                    visibility: "hidden",
                    position: "absolute",
                    top: "-9999px",
                }}
            ></div>

            {showManager.value && (
                <QuickDomainManager
                    onClose={handleManagerClose}
                    onDomainSelect={handleDomainClick}
                />
            )}
        </>
    )
}
