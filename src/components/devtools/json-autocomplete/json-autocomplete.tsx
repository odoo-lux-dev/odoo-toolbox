import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { FieldMetadata } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useJsonSuggestions } from "./hooks/use-json-suggestions";
import { adjustDropdownPosition } from "./utils/cursor-position";

interface JsonAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    fieldsMetadata: Record<string, FieldMetadata>;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    className?: string;
    mode?: "create" | "write";
    onAddRequiredFields?: () => void;
}

export const JsonAutocomplete = ({
    value,
    onChange,
    fieldsMetadata,
    placeholder = "Enter JSON...",
    rows = 10,
    disabled = false,
    className,
    mode,
    onAddRequiredFields,
}: JsonAutocompleteProps): JSX.Element => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        suggestions,
        showSuggestions,
        focusedIndex,
        cursorPosition,
        insertSuggestion,
        handleBraceInsertion,
        navigationKeyDown,
    } = useJsonSuggestions({
        value,
        onChange,
        fieldsMetadata,
        textareaRef,
        dropdownRef,
        mode,
        onAddRequiredFields,
    });

    const dropdownStyle = useSignal<{
        position: "absolute" | "fixed";
        top: number;
        left: number;
        zIndex: number;
    } | null>(null);

    useEffect(() => {
        if (!cursorPosition || !textareaRef.current) {
            dropdownStyle.value = null;
            return;
        }

        const textareaRect = textareaRef.current.getBoundingClientRect();

        const viewportRect: DOMRect = {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        };

        const absoluteTop = textareaRect.top + cursorPosition.top;
        const absoluteLeft = textareaRect.left + cursorPosition.left;

        const adjustedPosition = adjustDropdownPosition(
            { width: 320, height: 300 },
            {
                top: absoluteTop,
                left: absoluteLeft,
                lineHeight: cursorPosition.lineHeight,
            },
            viewportRect,
        );

        dropdownStyle.value = {
            position: "fixed" as const,
            top: adjustedPosition.top,
            left: adjustedPosition.left,
            zIndex: 9999,
        };
    }, [cursorPosition]);

    const handleKeyDown = (e: KeyboardEvent) => {
        handleBraceInsertion(e);
        navigationKeyDown(e);
    };

    return (
        <div className="relative w-full">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                className={`textarea-bordered font-mono ${className || ""}`}
                spellcheck={false}
                disabled={disabled}
                fullWidth
            />

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className={`z-50 flex max-h-75 min-w-[320px] flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 text-xs shadow-lg ${dropdownStyle.value ? "" : "absolute top-full left-0 mt-1"}`}
                    style={
                        dropdownStyle.value
                            ? {
                                  position: dropdownStyle.value.position,
                                  top: `${dropdownStyle.value.top}px`,
                                  left: `${dropdownStyle.value.left}px`,
                                  zIndex: dropdownStyle.value.zIndex,
                              }
                            : undefined
                    }
                >
                    <div className="max-h-[260px] overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion.field}
                                className={`json-autocomplete-suggestion flex cursor-pointer flex-col gap-1 border-l-2 border-transparent px-3 py-2 transition-colors last:border-b-0 hover:border-primary hover:bg-base-200 ${index === focusedIndex ? "border-primary! bg-base-200 text-base-content" : ""} ${suggestion.isSpecial ? "bg-primary/5" : ""}`}
                                onClick={() => insertSuggestion(suggestion)}
                            >
                                {suggestion.isSpecial ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-semibold text-primary">
                                            {suggestion.description}
                                        </div>
                                        <div className="text-xs text-base-content/70 italic">
                                            {String(suggestion.example)}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-base-content">
                                                {suggestion.field}
                                            </span>
                                            <Badge
                                                size="sm"
                                                variant="outline"
                                                className="ml-auto uppercase"
                                            >
                                                {suggestion.type}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-base-content/70">
                                            {suggestion.description}
                                        </div>
                                        <div className="mt-1 truncate rounded-sm bg-base-200/60 px-1.5 py-0.5 text-[11px] text-base-content/60">
                                            Example:{" "}
                                            {JSON.stringify(suggestion.example)}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-base-200 bg-base-200/60 px-3 py-2 text-center text-[10px] text-base-content/60 italic">
                        ↑↓ to navigate • Enter/Tab to select • Esc to close •
                        Ctrl+Space to force suggestions
                    </div>
                </div>
            )}
        </div>
    );
};
