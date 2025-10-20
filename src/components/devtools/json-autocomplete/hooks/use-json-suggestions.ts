import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import {
    type CursorPosition,
    getCursorPosition,
} from "@/components/devtools/json-autocomplete/utils/cursor-position";
import {
    analyzeJsonContext,
    extractUsedFields,
} from "@/components/devtools/json-autocomplete/utils/json-parser";
import {
    buildSuggestions,
    calculateInsertionParams,
    createRequiredFieldsSuggestion,
    getMissingRequiredFields,
    type Suggestion,
} from "@/components/devtools/json-autocomplete/utils/suggestion-builder";
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation";
import { FieldMetadata } from "@/types";

export interface UseJsonSuggestionsProps {
    value: string;
    onChange: (value: string) => void;
    fieldsMetadata: Record<string, FieldMetadata>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    dropdownRef: React.RefObject<HTMLDivElement>;
    mode?: "create" | "write"; // Renommé pour éviter confusion avec JsonContext
    onAddRequiredFields?: () => void;
}

export interface JsonSuggestionsActions {
    generateSuggestions: (forced?: boolean) => void;
    insertSuggestion: (suggestion: Suggestion) => void;
    handleBraceInsertion: (e: KeyboardEvent) => void;
}

export const useJsonSuggestions = ({
    value,
    onChange,
    fieldsMetadata,
    textareaRef,
    dropdownRef,
    mode,
    onAddRequiredFields,
}: UseJsonSuggestionsProps) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(
        null,
    );

    const usedFields = useMemo(() => extractUsedFields(value), [value]);

    const generateSuggestions = useCallback(
        (forced = false) => {
            if (
                !textareaRef.current ||
                Object.keys(fieldsMetadata).length === 0
            ) {
                setShowSuggestions(false);
                setCursorPosition(null);
                return;
            }

            const position = textareaRef.current.selectionStart || 0;
            const context = analyzeJsonContext(value, position);

            // Special case: Ctrl+Space on empty textarea
            if (forced && value.trim() === "") {
                onChange("{}");

                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(1, 1);
                        textareaRef.current.focus();
                    }
                }, 0);
                return;
            }

            let specialSuggestion: Suggestion | undefined;

            // Add special suggestion for required fields
            if (
                mode === "create" &&
                onAddRequiredFields &&
                context.braceCount > 0
            ) {
                const missingRequiredFields = getMissingRequiredFields(
                    value,
                    fieldsMetadata,
                );
                if (missingRequiredFields.length > 0) {
                    specialSuggestion = createRequiredFieldsSuggestion(
                        missingRequiredFields,
                        onAddRequiredFields,
                    );
                }
            }

            // Check if we can suggest
            // Automatic display only for empty or typing keys
            // Ctrl+Space (forced) allows display everywhere structurally possible
            if (!forced && !context.canSuggest) {
                setShowSuggestions(false);
                setCursorPosition(null);
                return;
            }

            // For forced suggestions, check that we are at least in a valid JSON structure
            if (forced && context.braceCount === 0) {
                setShowSuggestions(false);
                setCursorPosition(null);
                return;
            }

            const newSuggestions = buildSuggestions(
                fieldsMetadata,
                usedFields,
                context.partialText,
                10,
                specialSuggestion,
            );

            setSuggestions(newSuggestions);

            if (newSuggestions.length > 0) {
                const cursorPos = getCursorPosition(
                    textareaRef.current,
                    position,
                );
                setCursorPosition(cursorPos);
                setShowSuggestions(true);
                resetFocus();
            } else {
                setShowSuggestions(false);
                setCursorPosition(null);
            }
        },
        [value, fieldsMetadata, usedFields, onChange, textareaRef],
    );

    const insertSuggestion = useCallback(
        (suggestion: Suggestion) => {
            if (!textareaRef.current) return;

            if (suggestion.isSpecial && suggestion.specialAction) {
                suggestion.specialAction();
                setShowSuggestions(false);
                return;
            }

            const position = textareaRef.current.selectionStart || 0;
            const textBefore = value.substring(0, position);
            const textAfter = value.substring(position);
            const context = analyzeJsonContext(value, position);

            const { newValue, cursorPosition } = calculateInsertionParams(
                suggestion,
                textBefore,
                textAfter,
                context.isPartialReplacement,
                context.partialText,
            );

            onChange(newValue);
            setShowSuggestions(false);

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(
                        cursorPosition,
                        cursorPosition,
                    );
                    textareaRef.current.focus();
                }
            }, 0);
        },
        [value, onChange, textareaRef],
    );

    const handleBraceInsertion = useCallback(
        (e: KeyboardEvent) => {
            if (e.key !== "{" || !textareaRef.current) return;

            const position = textareaRef.current.selectionStart || 0;
            const textAfter = value.substring(position);

            if (!textAfter.trim().startsWith("}")) {
                e.preventDefault();
                const textBefore = value.substring(0, position);
                const newValue = textBefore + "{}" + textAfter;
                onChange(newValue);

                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(
                            position + 1,
                            position + 1,
                        );
                    }
                }, 0);
            }
        },
        [value, onChange, textareaRef],
    );

    const {
        handleKeyDown: navigationKeyDown,
        focusedIndex,
        resetFocus,
    } = useDropdownNavigation({
        items: suggestions,
        isOpen: showSuggestions,
        onSelect: (suggestion) => insertSuggestion(suggestion),
        onClose: () => setShowSuggestions(false),
        onTrigger: () => generateSuggestions(true),
        cyclicNavigation: false,
        acceptTab: true,
        triggerKey: "Ctrl+Space",
        containerRef: dropdownRef,
        itemSelector: ".json-autocomplete-suggestion",
    });

    useEffect(() => {
        generateSuggestions();
    }, [generateSuggestions]);

    useEffect(() => {
        const handleInput = () => {
            generateSuggestions();
        };

        const handleSelectionChange = () => {
            if (
                textareaRef.current &&
                document.activeElement === textareaRef.current
            ) {
                generateSuggestions();
            }
        };

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener("input", handleInput);
            document.addEventListener("selectionchange", handleSelectionChange);

            return () => {
                textarea.removeEventListener("input", handleInput);
                document.removeEventListener(
                    "selectionchange",
                    handleSelectionChange,
                );
            };
        }
    }, [generateSuggestions, textareaRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!showSuggestions) return;

            const target = event.target as Node;

            if (dropdownRef.current?.contains(target)) return;

            if (textareaRef.current?.contains(target)) {
                setTimeout(() => {
                    if (textareaRef.current) {
                        const position =
                            textareaRef.current.selectionStart || 0;
                        const context = analyzeJsonContext(value, position);
                        if (!context.canSuggest) {
                            setShowSuggestions(false);
                        }
                    }
                }, 0);
                return;
            }

            setShowSuggestions(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showSuggestions, value, textareaRef, dropdownRef]);

    return {
        suggestions,
        showSuggestions,
        focusedIndex,
        cursorPosition,
        generateSuggestions,
        insertSuggestion,
        handleBraceInsertion,
        navigationKeyDown,
    };
};
