import { useComputed, useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { loadingSignal } from "@/contexts/devtools-signals";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import { QuickDomain } from "@/types";
import { QuickDomainManager } from "./quick-domain-manager";

interface QuickDomainButtonsProps {
    onDomainSelect: (domain: string) => void;
}

/**
 * Dynamic quick domain buttons component
 * Shows domain buttons based on available space with overflow management
 */
export const QuickDomainButtons = ({
    onDomainSelect,
}: QuickDomainButtonsProps) => {
    const domains = useSignal<QuickDomain[]>([]);
    const loading = useSignal(true);
    const showManager = useSignal(false);
    const maxVisible = useSignal(3);
    const containerRef = useRef<HTMLDivElement>(null);
    const measurementRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const visibleDomains = useComputed(() =>
        domains.value.slice(0, Math.max(0, maxVisible.value)),
    );
    const hiddenCount = useComputed(() =>
        Math.max(0, domains.value.length - Math.max(0, maxVisible.value)),
    );
    const showOverflowButton = useComputed(() => hiddenCount.value > 0);

    useEffect(() => {
        loadDomains();

        const unwatch = quickDomainsService.watchQuickDomainsOrdered(
            (newDomains) => {
                if (newDomains) {
                    domains.value = newDomains;
                    calculateMaxVisible();
                }
            },
        );

        return unwatch;
    }, []);

    // Calculate how many buttons can fit in the available space
    useLayoutEffect(() => {
        calculateMaxVisible();

        // Recalculate on window resize
        const handleResize = () => setTimeout(() => calculateMaxVisible(), 100);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [domains.value]);

    const calculateMaxVisible = () => {
        if (!containerRef.current || !measurementRef.current) {
            return;
        }

        const container = containerRef.current;
        const measurement = measurementRef.current;
        const containerWidth = container.offsetWidth;
        const gap = 8;
        const rowWidth =
            container.parentElement?.getBoundingClientRect().width ??
            containerWidth;
        const settingsWidth = settingsRef.current?.offsetWidth ?? 0;
        const availableWidth = Math.max(0, rowWidth - settingsWidth - gap);

        if (availableWidth === 0) {
            return;
        }

        const maxButtonWidth = availableWidth;

        measurement.innerHTML = "";
        measurement.style.visibility = "hidden";
        measurement.style.position = "absolute";
        measurement.style.display = "flex";
        measurement.style.gap = `${gap}px`;
        measurement.style.whiteSpace = "nowrap";

        if (domains.value.length === 0) {
            maxVisible.value = 0;
            measurement.innerHTML = "";
            return;
        }

        const buttonWidths = domains.value.map((domain) => {
            const button = document.createElement("button");
            button.className = "btn btn-ghost btn-xs";
            button.textContent = domain.name;
            button.style.visibility = "hidden";
            button.style.maxWidth = `${maxButtonWidth}px`;
            button.style.whiteSpace = "normal";
            button.style.wordBreak = "break-word";
            measurement.appendChild(button);
            return button.offsetWidth;
        });

        const measureOverflowWidth = (count: number) => {
            const button = document.createElement("button");
            button.className = "btn btn-outline btn-xs";
            button.textContent = `+${count}`;
            button.style.visibility = "hidden";
            measurement.appendChild(button);
            return button.offsetWidth;
        };

        const calculateWithReservedWidth = (reservedWidth: number) => {
            let totalWidth = 0;
            let count = 0;

            for (let i = 0; i < buttonWidths.length; i++) {
                const buttonWidth = buttonWidths[i];
                const gapWidth = count > 0 ? gap : 0;
                const newTotalWidth = totalWidth + buttonWidth + gapWidth;

                if (newTotalWidth + reservedWidth <= availableWidth) {
                    totalWidth = newTotalWidth;
                    count += 1;
                } else {
                    break;
                }
            }

            return count;
        };

        let maxCount = calculateWithReservedWidth(0);

        if (maxCount < buttonWidths.length) {
            let overflowCount = Math.max(1, domains.value.length - maxCount);

            for (let i = 0; i < 2; i++) {
                const overflowWidth = measureOverflowWidth(overflowCount);
                const reservedWidth = overflowWidth + (maxCount > 0 ? gap : 0);
                const nextCount = calculateWithReservedWidth(reservedWidth);

                if (nextCount === maxCount) {
                    break;
                }

                maxCount = nextCount;
                overflowCount = Math.max(1, domains.value.length - maxCount);
            }
        }

        maxVisible.value = maxCount;
        measurement.innerHTML = "";
    };

    const loadDomains = async () => {
        try {
            const fetchedDomains =
                await quickDomainsService.getQuickDomainsOrdered();
            domains.value = fetchedDomains;
        } catch (error) {
            Logger.error("Failed to load quick domains:", error);
        } finally {
            loading.value = false;
        }
    };

    const handleDomainClick = (domain: string) => {
        onDomainSelect(domain);
    };

    const handleOverflowClick = () => {
        showManager.value = true;
    };

    const handleManagerClose = () => {
        showManager.value = false;
    };

    if (loading.value) {
        return (
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 flex-1">
                    <div className="text-xs text-base-content/60">
                        Loading domains...
                    </div>
                </div>
                <div ref={settingsRef} className="shrink-0">
                    <IconButton
                        type="button"
                        label="Manage domains"
                        variant="ghost"
                        size="xs"
                        circle={false}
                        className="text-base-content/60 hover:text-base-content"
                        onClick={handleOverflowClick}
                        disabled={loadingSignal.value}
                        icon={
                            <HugeiconsIcon
                                icon={Settings02Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.6}
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <div
                    className="flex flex-wrap gap-2 flex-1 min-w-0"
                    ref={containerRef}
                >
                    {domains.value.length > 0 ? (
                        visibleDomains.value.map((domain) => (
                            <Button
                                key={domain.id}
                                type="button"
                                variant="outline"
                                size="xs"
                                className="text-base-content/70 max-w-full whitespace-normal break-words"
                                onClick={() => handleDomainClick(domain.domain)}
                                title={`Domain: ${domain.domain}`}
                                disabled={loadingSignal.value}
                            >
                                {domain.name}
                            </Button>
                        ))
                    ) : (
                        <span className="text-xs text-base-content/60">
                            No quick domain available
                        </span>
                    )}

                    {showOverflowButton.value && (
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="text-base-content/70"
                            onClick={handleOverflowClick}
                            title={`Show ${hiddenCount.value} more domains`}
                            disabled={loadingSignal.value}
                        >
                            +{hiddenCount.value}
                        </Button>
                    )}
                </div>
                <div ref={settingsRef} className="shrink-0">
                    <IconButton
                        type="button"
                        label="Manage domains"
                        variant="ghost"
                        size="xs"
                        circle={false}
                        className="text-base-content/60 hover:text-base-content"
                        onClick={handleOverflowClick}
                        disabled={loadingSignal.value}
                        icon={
                            <HugeiconsIcon
                                icon={Settings02Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.6}
                            />
                        }
                    />
                </div>
            </div>
            <div
                ref={measurementRef}
                className="flex flex-wrap gap-2"
                style={{
                    visibility: "hidden",
                    position: "absolute",
                    top: "-9999px",
                }}
            ></div>
            <QuickDomainManager
                open={showManager.value}
                onClose={handleManagerClose}
                onDomainSelect={handleDomainClick}
            />
        </>
    );
};
