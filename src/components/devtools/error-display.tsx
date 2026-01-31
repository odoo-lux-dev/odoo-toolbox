import type { ComponentChildren } from "preact";
import type { OdooRpcError } from "@/services/odoo-error";

interface ErrorDisplayProps {
    error: string;
    errorDetails?: unknown;
}

const ErrorSection = ({
    title,
    children,
}: {
    title: string;
    children: ComponentChildren;
}) => (
    <div className="mb-4 last:mb-0">
        <h5 className="mb-2 text-xs font-semibold tracking-wide text-error/90 uppercase">
            {title}
        </h5>
        {children}
    </div>
);

const CodeBlock = ({
    data,
    className = "rounded-box border border-base-300/60 bg-base-200/50 p-2 text-xs text-base-content/70 whitespace-pre-wrap break-words max-h-48 overflow-y-auto",
}: {
    data: unknown;
    className?: string;
}) => (
    <pre className={className}>
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </pre>
);

const Detail = ({ label, value }: { label: string; value: unknown }) =>
    value ? (
        <div className="text-base-content/80">
            <span className="font-semibold text-base-content">{label}:</span>{" "}
            <span className="text-base-content/70">{String(value)}</span>
        </div>
    ) : null;

export const ErrorDisplay = ({ error, errorDetails }: ErrorDisplayProps) => {
    if (!errorDetails || typeof errorDetails !== "object") {
        return (
            <div className="rounded-box border border-base-300/60 bg-base-200/50 p-2 text-xs text-base-content/70">
                <pre className="wrap-break-word whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    const errorObj = errorDetails as Record<string, unknown>;

    if (errorObj.name === "RPC_ERROR") {
        const odoo = errorDetails as OdooRpcError;
        return (
            <div className="space-y-4">
                <ErrorSection title="Error Summary">
                    <div className="space-y-1 text-xs text-base-content/80">
                        <Detail
                            label="Type"
                            value={odoo.exceptionName || "Unknown"}
                        />
                        <Detail label="Model" value={odoo.model || "N/A"} />
                        <Detail label="Message" value={odoo.message} />
                        <Detail label="Code" value={odoo.code} />
                    </div>
                </ErrorSection>

                {odoo.data && (
                    <ErrorSection title="Error Data">
                        <div className="space-y-2 text-xs text-base-content/80">
                            {odoo.data.message && (
                                <div>
                                    <strong>Detailed Message</strong>
                                    <CodeBlock data={odoo.data.message} />
                                </div>
                            )}
                            {odoo.data.arguments &&
                                Array.isArray(odoo.data.arguments) && (
                                    <div>
                                        <strong>Arguments</strong>
                                        <CodeBlock data={odoo.data.arguments} />
                                    </div>
                                )}
                        </div>
                    </ErrorSection>
                )}

                {odoo.data?.debug && (
                    <ErrorSection title="Debug Traceback">
                        <CodeBlock
                            data={odoo.data.debug}
                            className="max-h-[40vh] overflow-y-auto rounded-box border border-error/30 bg-base-200/50 p-2 text-xs/relaxed wrap-break-word whitespace-pre-wrap text-base-content/70"
                        />
                    </ErrorSection>
                )}

                {odoo.data?.context &&
                    Object.keys(odoo.data.context).length > 0 && (
                        <ErrorSection title="Context">
                            <CodeBlock data={odoo.data.context} />
                        </ErrorSection>
                    )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1 text-xs text-base-content/80">
                <Detail label="Type" value={errorObj.name || "Error"} />
                <Detail label="Message" value={error} />
            </div>
            {errorObj.stack && (
                <ErrorSection title="Stack Trace">
                    <CodeBlock
                        data={errorObj.stack}
                        className="max-h-[40vh] overflow-y-auto rounded-box border border-error/30 bg-base-200/50 p-2 text-xs/relaxed wrap-break-word whitespace-pre-wrap text-base-content/70"
                    />
                </ErrorSection>
            )}
            <ErrorSection title="Full Error Object">
                <CodeBlock data={errorObj} />
            </ErrorSection>
        </div>
    );
};
