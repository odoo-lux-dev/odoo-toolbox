import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuickDomain } from "@/types";
import { validateDomain } from "@/utils/query-validation";

interface QuickDomainFormModalProps {
    domain: QuickDomain | null;
    onSave: (data: { name: string; domain: string }) => void;
    onCancel: () => void;
    isOpen: boolean;
}

export const QuickDomainFormModal = ({
    domain,
    onSave,
    onCancel,
    isOpen,
}: QuickDomainFormModalProps) => {
    const name = useSignal(domain?.name || "");
    const domainValue = useSignal(domain?.domain || "");
    const validation = useComputed(() => validateDomain(domainValue.value));

    const isValid = useComputed(() => validation.value.isValid);
    const canSave = useComputed(
        () => name.value.trim() && domainValue.value.trim() && isValid.value,
    );

    useEffect(() => {
        if (isOpen) {
            name.value = domain?.name || "";
            domainValue.value = domain?.domain || "";
        }
    }, [domain, isOpen]);

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        if (canSave.value) {
            onSave({
                name: name.value.trim(),
                domain: domainValue.value.trim(),
            });
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onCancel}
            title={domain ? "Edit Domain" : "Add New Domain"}
            size="lg"
            boxClassName="border border-base-300"
            footer={
                <>
                    <Button
                        variant="outline"
                        color="error"
                        size="sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="quick-domain-form"
                        color="primary"
                        size="sm"
                        disabled={!canSave.value}
                    >
                        {domain ? "Update" : "Add"} Domain
                    </Button>
                </>
            }
        >
            <form
                id="quick-domain-form"
                className="flex flex-col gap-4"
                onSubmit={handleSubmit}
            >
                <FormField label="Name" required className="gap-2">
                    <Input
                        type="text"
                        value={name.value}
                        onInput={(e) =>
                            (name.value = (e.target as HTMLInputElement).value)
                        }
                        placeholder="e.g., Active Records"
                        className="input-bordered input-sm"
                        fullWidth
                        required
                    />
                </FormField>

                <FormField label="Domain" required className="gap-2">
                    <Textarea
                        value={domainValue.value}
                        onInput={(e) =>
                            (domainValue.value = (
                                e.target as HTMLTextAreaElement
                            ).value)
                        }
                        placeholder='e.g., [["active", "=", true]]'
                        className="textarea-bordered textarea-sm font-mono"
                        rows={3}
                        fullWidth
                        color={
                            !isValid.value && domainValue.value
                                ? "error"
                                : undefined
                        }
                        required
                    />
                    {!isValid.value && domainValue.value && (
                        <div className="text-xs text-error">
                            {validation.value.error}
                        </div>
                    )}
                </FormField>
            </form>
        </Modal>
    );
};
