import { useComputed, useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { domainSignal, loadingSignal } from "@/contexts/devtools-signals";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { validateDomain } from "@/utils/query-validation";
import { QuickDomainButtons } from "./quick-domain-buttons";

interface DomainEditorProps {
    placeholder?: string;
}

export const DomainEditor = ({
    placeholder = 'Enter domain (e.g., [["active", "=", true]])',
}: DomainEditorProps) => {
    const validation = useComputed(() => validateDomain(domainSignal.value));
    const isValid = useComputed(() => validation.value.isValid);
    const error = useComputed(() => validation.value.error || null);
    const isHelpOpen = useSignal(false);

    const handleChange = (e: Event) => {
        const target = e.target as HTMLTextAreaElement;
        const newValue = target.value;

        domainSignal.value = newValue;
    };

    const addCommonDomain = (domain: string) => {
        const currentValue = domainSignal.value.trim();
        let finalDomain: string;

        if (currentValue === "" || currentValue === "[]") {
            finalDomain = domain;
        } else {
            try {
                const current = JSON.parse(currentValue);
                const newDomain = JSON.parse(domain);
                const merged = ["&", ...current, ...newDomain];
                finalDomain = JSON.stringify(merged);
            } catch {
                finalDomain = domain;
            }
        }

        domainSignal.value = finalDomain;
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <Textarea
                        value={domainSignal.value}
                        onInput={handleChange}
                        placeholder={placeholder}
                        className="textarea-bordered textarea min-h-[60px] pr-9 font-mono textarea-sm"
                        rows={1}
                        disabled={loadingSignal.value}
                        fullWidth
                        size="xs"
                        color={!isValid.value ? "error" : undefined}
                    />
                    <IconButton
                        type="button"
                        label="Domain format help"
                        variant="ghost"
                        size="xs"
                        className="absolute top-2 right-2 text-base-content/50 hover:text-base-content"
                        onClick={() => {
                            isHelpOpen.value = true;
                        }}
                        disabled={loadingSignal.value}
                        icon={
                            <HugeiconsIcon
                                icon={HelpCircleIcon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.8}
                            />
                        }
                    />
                </div>
                {error.value && (
                    <div className="mt-1 text-xs whitespace-pre-wrap text-error">
                        {error.value}
                    </div>
                )}
            </div>

            <QuickDomainButtons onDomainSelect={addCommonDomain} />

            <Modal
                open={isHelpOpen.value}
                onClose={() => {
                    isHelpOpen.value = false;
                }}
                title="Domain format help"
                size="lg"
            >
                <div className="mt-3 space-y-2 text-xs text-base-content/70 [&_code]:rounded-sm [&_code]:bg-base-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono">
                    <p>
                        <strong>🐍 Python domains are supported !</strong>
                    </p>
                    <p>You can use either JSON format or Python format:</p>

                    <div className="my-3 flex flex-col gap-3">
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-base-content">
                                JSON Format (Odoo RPC):
                            </h4>
                            <ul className="list-disc space-y-1 pl-4">
                                <li>
                                    <code>[["name", "ilike", "test"]]</code>
                                </li>
                                <li>
                                    <code>
                                        ["&", ["active", "=", true], ["name",
                                        "!=", false]]
                                    </code>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-base-content">
                                Python Format (Auto-converted):
                            </h4>
                            <ul className="list-disc space-y-1 pl-4">
                                <li>
                                    <code>[('name', 'ilike', 'test')]</code>
                                </li>
                                <li>
                                    <code>
                                        [('active', '=', True), ('name', '!=',
                                        False)]
                                    </code>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <p>Domain operators (Polish notation):</p>
                    <ul className="list-disc space-y-1 pl-4">
                        <li>
                            <code>"&"</code> - AND operator
                        </li>
                        <li>
                            <code>"|"</code> - OR operator
                        </li>
                        <li>
                            <code>"!"</code> - NOT operator
                        </li>
                    </ul>
                    <p>
                        Conditions format:{" "}
                        <code>["field", "operator", value]</code>
                    </p>
                    <p>
                        Common operators: <code>=</code>, <code>!=</code>,{" "}
                        <code>&gt;</code>, <code>&lt;</code>, <code>like</code>,{" "}
                        <code>ilike</code>, <code>in</code>
                    </p>
                </div>
            </Modal>
        </div>
    );
};
