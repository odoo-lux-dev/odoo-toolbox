import { ErrorDisplay } from "@/components/devtools/error-display";

interface ErrorStateProps {
    error: string;
    errorDetails?: unknown;
}

export const ErrorState = ({ error, errorDetails }: ErrorStateProps) => (
    <div className="flex h-full min-h-0 items-stretch py-3">
        <div className="size-full min-h-0 overflow-auto rounded-box border border-error/30 bg-error/10 p-4 text-sm text-base-content">
            <h4 className="mb-3 text-sm font-semibold text-error">
                Query Error
            </h4>
            <ErrorDisplay error={error} errorDetails={errorDetails} />
        </div>
    </div>
);
