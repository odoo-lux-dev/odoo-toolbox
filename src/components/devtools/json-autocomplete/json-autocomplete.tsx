import "./json-autocomplete.scss";
import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { FieldMetadata } from "@/types";
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
        <div className="json-autocomplete-container">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                className={`json-autocomplete-textarea ${className || ""}`}
                spellcheck={false}
                disabled={disabled}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="json-autocomplete-dropdown"
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
                    <div className="json-autocomplete-suggestions">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion.field}
                                className={`json-autocomplete-suggestion ${index === focusedIndex ? "selected" : ""} ${
                                    suggestion.isSpecial ? "special" : ""
                                }`}
                                onClick={() => insertSuggestion(suggestion)}
                            >
                                {suggestion.isSpecial ? (
                                    <div className="special-suggestion">
                                        <div className="special-suggestion-title">
                                            {suggestion.description}
                                        </div>
                                        <div className="special-suggestion-subtitle">
                                            {String(suggestion.example)}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <span className="suggestion-field">
                                                {suggestion.field}
                                            </span>
                                            <span className="suggestion-type">
                                                {suggestion.type}
                                            </span>
                                        </div>
                                        <div className="suggestion-description">
                                            {suggestion.description}
                                        </div>
                                        <div className="suggestion-example">
                                            Example:{" "}
                                            {JSON.stringify(suggestion.example)}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="json-autocomplete-hint">
                        ↑↓ to navigate • Enter/Tab to select • Esc to close •
                        Ctrl+Space to force suggestions
                    </div>
                </div>
            )}
        </div>
    );
};
