export const LoadingState = () => (
    <div className="flex h-full min-h-[200px] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-base-content/70">
            <span className="loading loading-md loading-spinner" />
            <span>Executing query...</span>
        </div>
    </div>
);
