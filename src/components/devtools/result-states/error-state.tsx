import { ErrorDisplay } from "@/components/devtools/error-display";

interface ErrorStateProps {
    error: string;
    errorDetails?: unknown;
}

export const ErrorState = ({ error, errorDetails }: ErrorStateProps) => (
    <div className="result-viewer error">
        <div className="error-message">
            <h4>Query Error</h4>
            <ErrorDisplay error={error} errorDetails={errorDetails} />
        </div>
    </div>
);
