import "@/components/devtools/domain-editor/domain-editor.styles.scss";
import { useComputed } from "@preact/signals";
import { domainSignal, loadingSignal } from "@/contexts/devtools-signals";
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
        <div className="domain-editor-container">
            <div className="domain-input-wrapper">
                <textarea
                    value={domainSignal.value}
                    onInput={handleChange}
                    placeholder={placeholder}
                    className={`form-input domain-editor ${!isValid.value ? "error" : ""}`}
                    rows={4}
                    disabled={loadingSignal.value}
                />
                {error.value && (
                    <div className="domain-error">{error.value}</div>
                )}
            </div>

            <QuickDomainButtons onDomainSelect={addCommonDomain} />

            <div className="domain-help">
                <details>
                    <summary>Domain format help</summary>
                    <div className="help-content">
                        <p>
                            <strong>🐍 Python domains are supported !</strong>
                        </p>
                        <p>You can use either JSON format or Python format:</p>

                        <div className="format-examples">
                            <div className="format-section">
                                <h4>JSON Format (Odoo RPC):</h4>
                                <ul>
                                    <li>
                                        <code>[["name", "ilike", "test"]]</code>
                                    </li>
                                    <li>
                                        <code>
                                            ["&", ["active", "=", true],
                                            ["name", "!=", false]]
                                        </code>
                                    </li>
                                </ul>
                            </div>

                            <div className="format-section">
                                <h4>Python Format (Auto-converted):</h4>
                                <ul>
                                    <li>
                                        <code>[('name', 'ilike', 'test')]</code>
                                    </li>
                                    <li>
                                        <code>
                                            [('active', '=', True), ('name',
                                            '!=', False)]
                                        </code>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <p>Domain operators (Polish notation):</p>
                        <ul>
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
                            <code>&gt;</code>, <code>&lt;</code>,{" "}
                            <code>like</code>, <code>ilike</code>,{" "}
                            <code>in</code>
                        </p>
                    </div>
                </details>
            </div>
        </div>
    );
};
