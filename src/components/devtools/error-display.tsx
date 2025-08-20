import type { ComponentChildren } from "preact"
import type { OdooRpcError } from "@/services/odoo-error"

interface ErrorDisplayProps {
    error: string
    errorDetails?: unknown
}

const ErrorSection = ({
    title,
    children,
}: {
    title: string
    children: ComponentChildren
}) => (
    <div className="error-section">
        <h5>{title}</h5>
        {children}
    </div>
)

const CodeBlock = ({
    data,
    className = "error-code",
}: {
    data: unknown
    className?: string
}) => (
    <pre className={className}>
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </pre>
)

const Detail = ({ label, value }: { label: string; value: unknown }) =>
    value ? (
        <div>
            <strong>{label}:</strong> {String(value)}
        </div>
    ) : null

export const ErrorDisplay = ({ error, errorDetails }: ErrorDisplayProps) => {
    if (!errorDetails || typeof errorDetails !== "object") {
        return (
            <div className="error-simple">
                <pre>{error}</pre>
            </div>
        )
    }

    const errorObj = errorDetails as Record<string, unknown>

    if (errorObj.name === "RPC_ERROR") {
        const odoo = errorDetails as OdooRpcError
        return (
            <div className="error-odoo">
                <ErrorSection title="Error Summary">
                    <div className="error-details">
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
                        <div className="error-details">
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
                            className="error-traceback"
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
        )
    }

    return (
        <div className="error-generic">
            <div className="error-details">
                <Detail label="Type" value={errorObj.name || "Error"} />
                <Detail label="Message" value={error} />
            </div>
            {errorObj.stack && (
                <ErrorSection title="Stack Trace">
                    <CodeBlock
                        data={errorObj.stack}
                        className="error-traceback"
                    />
                </ErrorSection>
            )}
            <ErrorSection title="Full Error Object">
                <CodeBlock data={errorObj} />
            </ErrorSection>
        </div>
    )
}
