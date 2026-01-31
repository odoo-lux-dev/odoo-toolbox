import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { createSwapy, Swapy, utils } from "swapy";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import { QuickDomain } from "@/types";
import { QuickDomainFormModal } from "./quick-domain-form-modal";
import { QuickDomainRow } from "./quick-domain-row";

interface QuickDomainManagerProps {
    open: boolean;
    onClose: () => void;
    onDomainSelect: (domain: string) => void;
}

export const QuickDomainManager = ({
    open,
    onClose,
    onDomainSelect,
}: QuickDomainManagerProps) => {
    const domains = useSignal<QuickDomain[]>([]);
    const loading = useSignal(true);
    const showForm = useSignal(false);
    const editingDomain = useSignal<QuickDomain | null>(null);
    const slotItemMap = useSignal<Array<{ slot: string; item: string }>>([]);
    const slottedItems = useComputed(() =>
        utils.toSlottedItems(domains.value, "id", slotItemMap.value),
    );
    const swapyRef = useRef<Swapy | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedDomains =
                    await quickDomainsService.getQuickDomainsOrdered();
                domains.value = fetchedDomains;
                slotItemMap.value = utils.initSlotItemMap(fetchedDomains, "id");
            } catch (error) {
                Logger.error("Failed to load domains:", error);
            } finally {
                loading.value = false;
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        utils.dynamicSwapy(
            swapyRef.current,
            domains.value,
            "id",
            slotItemMap.value,
            (newSlotItemMap) => {
                slotItemMap.value = newSlotItemMap;
            },
        );
    }, [domains.value]);

    useEffect(() => {
        if (loading.value) return;

        swapyRef.current = createSwapy(containerRef.current!, {
            manualSwap: true,
            animation: "spring",
            autoScrollOnDrag: true,
            dragAxis: "y",
        });

        swapyRef.current.onSwap((event) => {
            slotItemMap.value = event.newSlotItemMap.asArray;
        });

        swapyRef.current.onSwapEnd(async (event) => {
            if (event.hasChanged) {
                try {
                    const newOrderedDomains = event.slotItemMap.asArray
                        .map(({ item }) => {
                            return domains.value.find((d) => d.id === item);
                        })
                        .filter(Boolean) as QuickDomain[];

                    const domainsWithNewSequence = newOrderedDomains.map(
                        (domain, index) => ({
                            ...domain,
                            sequence: index,
                        }),
                    );

                    await quickDomainsService.setQuickDomainsOrdered(
                        domainsWithNewSequence,
                    );
                } catch (error) {
                    Logger.error("Failed to save new order:", error);
                }
            }
        });

        return () => {
            swapyRef.current?.destroy();
        };
    }, [loading.value]);

    const handleDelete = (domainId: string) => {
        domains.value = domains.value.filter((d) => d.id !== domainId);
        quickDomainsService.deleteQuickDomain(domainId).catch(Logger.error);
    };

    const handleAdd = () => {
        editingDomain.value = null;
        showForm.value = true;
    };

    const handleEdit = (domain: QuickDomain) => {
        editingDomain.value = domain;
        showForm.value = true;
    };

    const handleSave = async (domainData: { name: string; domain: string }) => {
        if (editingDomain.value) {
            const updatedDomain = {
                ...editingDomain.value,
                ...domainData,
            };
            domains.value = domains.value.map((d) =>
                d.id === editingDomain.value!.id ? updatedDomain : d,
            );
            await quickDomainsService.updateQuickDomain(
                updatedDomain.id,
                updatedDomain,
            );
        } else {
            const newDomain: QuickDomain = {
                id: `domain-${Date.now()}`,
                sequence: domains.value.length,
                ...domainData,
            };
            domains.value = [...domains.value, newDomain];
            await quickDomainsService.addQuickDomain(newDomain);
        }
        showForm.value = false;
        editingDomain.value = null;
    };

    const handleCancel = () => {
        showForm.value = false;
        editingDomain.value = null;
    };

    const handleDomainClick = (domain: string) => {
        onDomainSelect(domain);
        onClose();
    };

    if (loading.value) {
        return (
            <Modal
                open={open}
                onClose={onClose}
                title="Quick Domain Manager"
                size="lg"
                boxClassName="border border-base-300"
            >
                <div className="flex h-[40vh] items-center justify-center text-sm text-base-content/60">
                    Loading domains...
                </div>
            </Modal>
        );
    }

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title="Quick Domain Manager"
                size="xl"
                boxClassName="border border-base-300 max-w-3xl"
            >
                <div className="flex h-[70vh] flex-col">
                    <div className="flex items-center justify-between">
                        <Button
                            onClick={handleAdd}
                            color="accent"
                            variant="outline"
                            className="my-3 w-full"
                            size="sm"
                        >
                            Add Domain
                        </Button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div
                            className="flex h-full flex-col gap-2 overflow-y-auto pr-1 transition-none **:data-swapy-container:transition-none **:data-swapy-item:transition-none **:data-swapy-slot:transition-none [&_[data-swapy-item]_*]:transition-none [&_[data-swapy-slot]_*]:transition-none"
                            ref={containerRef}
                        >
                            {slottedItems.value.map(
                                ({
                                    slotId,
                                    itemId,
                                    item,
                                }: {
                                    slotId: string;
                                    itemId: string;
                                    item: QuickDomain | null;
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
                                    ),
                            )}
                        </div>

                        {domains.value.length === 0 && (
                            <div className="py-10 text-center text-sm text-base-content/60">
                                <p className="mb-2 font-medium text-base-content">
                                    No domains found.
                                </p>
                                <p>Click "Add Domain" to create one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
            <QuickDomainFormModal
                domain={editingDomain.value}
                onSave={handleSave}
                onCancel={handleCancel}
                isOpen={showForm.value}
            />
        </>
    );
};
