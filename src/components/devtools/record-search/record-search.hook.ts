import { signal } from "@preact/signals";
import { useCallback } from "preact/hooks";

interface SearchResult {
    recordIndex: number;
    fieldPath: string[];
    displayText: string;
    matchStart: number;
    matchEnd: number;
    matchType: "key" | "value";
    element: Element;
}

export const useRecordSearch = () => {
    const allSearchResults = signal<SearchResult[]>([]);
    const currentSearchResult = signal<SearchResult | null>(null);

    // Build field path by traversing up the DOM structure
    const buildFieldPath = (
        element: Element,
        recordElement: Element,
    ): string[] => {
        const fieldPath: string[] = [];
        let currentElement = element as Element;

        while (currentElement && currentElement !== recordElement) {
            const fieldName = currentElement.getAttribute("data-field");
            if (fieldName) {
                fieldPath.unshift(fieldName);
            }
            currentElement = currentElement.parentElement!;
        }

        return fieldPath;
    };

    // Search using data-searchable attributes
    const performSearch = useCallback(
        (searchText: string, expandedRecords: Set<number>): SearchResult[] => {
            const term = searchText.trim();
            if (!term || term.length < 1) {
                clearHighlights();
                return [];
            }

            const results: SearchResult[] = [];
            const searchLower = term.toLowerCase();

            // Search in all records (both expanded and collapsed for headers)
            const recordElements = document.querySelectorAll(
                "[data-record-index]",
            );

            recordElements.forEach((recordElement) => {
                const recordIndexAttr =
                    recordElement.getAttribute("data-record-index");
                if (!recordIndexAttr) return;

                const recordIndex = parseInt(recordIndexAttr, 10);

                // Always search in headers (record-id and record-name)
                const headerElements = recordElement.querySelectorAll(
                    ".record-header [data-searchable]",
                );

                headerElements.forEach((element) => {
                    const searchableText =
                        element.getAttribute("data-searchable");
                    const fieldName = element.getAttribute("data-field");

                    if (!searchableText || !fieldName) return;

                    const searchableTextLower = searchableText.toLowerCase();
                    if (searchableTextLower.includes(searchLower)) {
                        const matchIndex =
                            searchableTextLower.indexOf(searchLower);

                        results.push({
                            recordIndex,
                            fieldPath: [fieldName],
                            displayText: searchableText,
                            matchStart: matchIndex,
                            matchEnd: matchIndex + term.length,
                            matchType: "value",
                            element: element as Element,
                        });
                    }
                });

                // Only search in detailed fields if the record is expanded
                if (expandedRecords.has(recordIndex)) {
                    // Search in all field elements with data-searchable (avoiding duplicates)
                    const allSearchableElements =
                        recordElement.querySelectorAll("[data-searchable]");
                    const processedElements = new Set<Element>();

                    allSearchableElements.forEach((element) => {
                        // Skip if already processed or if it's a header element
                        if (
                            processedElements.has(element) ||
                            element.closest(".record-header")
                        ) {
                            return;
                        }
                        processedElements.add(element);

                        const searchableText =
                            element.getAttribute("data-searchable");
                        if (!searchableText) return;

                        // Build field path by traversing up the DOM
                        const fieldPath = buildFieldPath(
                            element,
                            recordElement,
                        );
                        if (fieldPath.length === 0) return;

                        const searchableTextLower =
                            searchableText.toLowerCase();
                        if (searchableTextLower.includes(searchLower)) {
                            const matchIndex =
                                searchableTextLower.indexOf(searchLower);

                            // Determine if this is a key or value match
                            const isLabelElement =
                                element.classList.contains("detail-label");
                            const matchType: "key" | "value" = isLabelElement
                                ? "key"
                                : "value";

                            results.push({
                                recordIndex,
                                fieldPath,
                                displayText: isLabelElement
                                    ? fieldPath[fieldPath.length - 1]
                                    : searchableText,
                                matchStart: matchIndex,
                                matchEnd: matchIndex + term.length,
                                matchType,
                                element: element as Element,
                            });
                        }
                    });
                }
            });

            const uniqueResultMap = new Map<string, SearchResult>();

            results.forEach((result) => {
                const searchableText =
                    result.element.getAttribute("data-searchable") || "";
                const uniqueKey = `${result.recordIndex}-${result.fieldPath.join(".")}-${result.matchType}-${searchableText}`;

                if (!uniqueResultMap.has(uniqueKey)) {
                    uniqueResultMap.set(uniqueKey, result);
                }
            });

            const deduplicatedResults = Array.from(uniqueResultMap.values());

            // Sort results by level first, then by field name (id first), then by depth, then by record index
            deduplicatedResults.sort((a, b) => {
                // Get level from data-level attribute, default to 0
                const levelA = parseInt(
                    a.element.getAttribute("data-level") || "0",
                );
                const levelB = parseInt(
                    b.element.getAttribute("data-level") || "0",
                );

                if (levelA !== levelB) {
                    return levelA - levelB; // Lower levels first
                }

                // Get field name - use data-field if available, otherwise use field path
                const fieldA =
                    a.element.getAttribute("data-field") ||
                    a.fieldPath[a.fieldPath.length - 1] ||
                    "";
                const fieldB =
                    b.element.getAttribute("data-field") ||
                    b.fieldPath[b.fieldPath.length - 1] ||
                    "";

                if (fieldA !== fieldB) {
                    // Priority order: "id" field first, then alphabetical
                    if (fieldA === "id") return -1;
                    if (fieldB === "id") return 1;
                    return fieldA.localeCompare(fieldB); // Alphabetical order for other fields
                }

                const depthA = a.fieldPath.length;
                const depthB = b.fieldPath.length;

                if (depthA !== depthB) {
                    return depthA - depthB; // Shorter paths first
                }

                return a.recordIndex - b.recordIndex;
            });

            allSearchResults.value = deduplicatedResults;
            highlightAllResults(deduplicatedResults);
            return deduplicatedResults;
        },
        [],
    );

    // Ellipsis check (only called when needed)
    const checkAndShowEllipsis = (
        element: Element,
        searchText: string,
        isCurrent: boolean,
    ) => {
        // Quick pre-check: only for elements that might have ellipsis
        const style = window.getComputedStyle(element);
        if (style.textOverflow !== "ellipsis" && style.overflow !== "hidden")
            return;

        // Simple heuristic: if text is long enough to potentially be truncated
        const textContent = element.textContent || "";
        if (textContent.length < 30) return;

        // Quick check if element or parent has scroll overflow (max 3 levels)
        let hasOverflow = false;
        let current: Element | null = element;
        for (let i = 0; i < 3 && current; i++) {
            if (current.scrollWidth > current.clientWidth + 5) {
                hasOverflow = true;
                break;
            }
            current = current.parentElement;
        }

        if (!hasOverflow) return;

        // Create ellipsis indicator
        const ellipsisIndicator = document.createElement("span");
        ellipsisIndicator.className = `record-search-ellipsis-highlight${isCurrent ? " current-match" : ""}`;
        ellipsisIndicator.textContent = "● ";
        ellipsisIndicator.title = `Match found in hidden text: "${searchText}"`;

        // Insert point
        const container =
            element.closest(".detail-values, .cell-object, .detail-field") ||
            element.parentElement;
        container?.parentNode?.insertBefore(ellipsisIndicator, container);
    };

    // Text highlighting
    const highlightTextInTargetElement = (
        targetElement: Element,
        searchText: string,
        result: SearchResult,
        isCurrent: boolean,
    ) => {
        const walker = document.createTreeWalker(
            targetElement,
            NodeFilter.SHOW_TEXT,
            null,
        );

        let textNode: Text | null;
        while ((textNode = walker.nextNode() as Text | null)) {
            const nodeText = textNode.textContent || "";
            const matchIndex = nodeText
                .toLowerCase()
                .indexOf(searchText.toLowerCase());

            if (matchIndex !== -1) {
                const beforeText = nodeText.substring(0, matchIndex);
                const matchText = nodeText.substring(
                    matchIndex,
                    matchIndex + searchText.length,
                );
                const afterText = nodeText.substring(
                    matchIndex + searchText.length,
                );

                const parent = textNode.parentNode;
                if (parent) {
                    const highlightNode = document.createElement("mark");
                    highlightNode.className = `record-search-highlight${isCurrent ? " current-match" : ""} ${result.matchType}-match`;
                    highlightNode.textContent = matchText;

                    if (beforeText)
                        parent.insertBefore(
                            document.createTextNode(beforeText),
                            textNode,
                        );
                    parent.insertBefore(highlightNode, textNode);
                    if (afterText)
                        parent.insertBefore(
                            document.createTextNode(afterText),
                            textNode,
                        );
                    parent.removeChild(textNode);
                }
                break;
            }
        }
    };

    // Highlight text in element (ellipsis only for current result)
    const highlightTextInElement = (
        element: Element,
        result: SearchResult,
        isCurrent: boolean = false,
    ) => {
        const searchText = result.displayText.substring(
            result.matchStart,
            result.matchEnd,
        );

        const targetElement =
            result.matchType === "key"
                ? element.querySelector(".detail-label") || element
                : element;

        // Only check ellipsis for current result to avoid performance hit
        if (isCurrent && result.matchType === "value") {
            checkAndShowEllipsis(element, searchText, true);
        }

        highlightTextInTargetElement(
            targetElement,
            searchText,
            result,
            isCurrent,
        );
    };

    // Highlight all search results (without ellipsis indicators for performance)
    const highlightAllResults = useCallback((results: SearchResult[]) => {
        clearHighlights();
        results.forEach((result) => {
            highlightTextInElement(result.element, result, false);
        });
    }, []);

    // Navigate to a specific result (with ellipsis check)
    const navigateToResult = useCallback((result: SearchResult) => {
        currentSearchResult.value = result;

        // Remove current-match class from all highlights
        document
            .querySelectorAll(
                ".record-search-highlight.current-match, .record-search-ellipsis-highlight.current-match",
            )
            .forEach((el) => {
                el.classList.remove("current-match");
            });

        // Remove all ellipsis indicators first
        document
            .querySelectorAll(".record-search-ellipsis-highlight")
            .forEach((el) => el.remove());

        // Scroll to the element
        const elementRect = result.element.getBoundingClientRect();
        const resultViewer = document.querySelector(".result-viewer");
        const container = resultViewer?.querySelector(
            ".result-list-container, .relational-records",
        ) as HTMLElement;

        if (container) {
            const containerRect = container.getBoundingClientRect();
            const scrollTop =
                container.scrollTop +
                elementRect.top -
                containerRect.top -
                containerRect.height / 3;

            container.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: "instant",
            });
        }

        // Highlight current result with ellipsis check
        highlightTextInElement(result.element, result, true);

        // Add current-match class
        const searchText = result.displayText
            .substring(result.matchStart, result.matchEnd)
            .toLowerCase();

        const highlights = result.element.querySelectorAll(
            ".record-search-highlight, .record-search-ellipsis-highlight",
        );
        let highlightFound = false;

        for (const highlight of highlights) {
            if (
                highlight.classList.contains(
                    "record-search-ellipsis-highlight",
                ) ||
                highlight.textContent?.toLowerCase() === searchText
            ) {
                highlight.classList.add("current-match");
                highlightFound = true;
                break;
            }
        }

        if (!highlightFound) {
            const parentHighlights =
                result.element.parentElement?.querySelectorAll(
                    ".record-search-highlight, .record-search-ellipsis-highlight",
                ) || [];
            for (const highlight of parentHighlights) {
                if (
                    highlight.classList.contains(
                        "record-search-ellipsis-highlight",
                    ) ||
                    (highlight.textContent?.toLowerCase() === searchText &&
                        highlight.contains(result.element))
                ) {
                    highlight.classList.add("current-match");
                    break;
                }
            }
        }
    }, []);

    const clearHighlights = useCallback(() => {
        document
            .querySelectorAll(
                ".record-search-highlight, .record-search-ellipsis-highlight",
            )
            .forEach((el) => {
                const parent = el.parentNode;
                if (parent) {
                    if (
                        el.classList.contains(
                            "record-search-ellipsis-highlight",
                        )
                    ) {
                        parent.removeChild(el);
                    } else {
                        parent.replaceChild(
                            document.createTextNode(el.textContent || ""),
                            el,
                        );
                    }
                    parent.normalize();
                }
            });
        currentSearchResult.value = null;
    }, []);

    return {
        currentSearchResult: currentSearchResult.value,
        allSearchResults: allSearchResults.value,
        performSearch,
        navigateToResult,
        clearHighlights,
    };
};
