import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { debounce } from "@solid-primitives/scheduled";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { t } from "@/services/i18n-service";

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
  const [allSearchResults, setAllSearchResults] = createSignal<SearchResult[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = createSignal<SearchResult | null>(null);

  const highlightBaseClass = "record-search-highlight inline font-medium rounded";
  const highlightKeyClass = "bg-yellow-300 text-neutral-900";
  const highlightValueClass = "bg-yellow-200 text-neutral-900";
  const highlightCurrentKeyClass = "!bg-orange-600 text-white";
  const highlightCurrentValueClass = "!bg-orange-600 text-white";
  const ellipsisBaseClass =
    "record-search-ellipsis-highlight inline rounded text-[8px] text-orange-600 my-auto ms-2";
  const ellipsisCurrentClass = "bg-orange-500 text-white shadow-[0_0_0_2px_rgba(255,107,53,0.3)]";

  const toggleClassList = (element: Element, classes: string, add: boolean) => {
    classes
      .split(" ")
      .filter(Boolean)
      .forEach((className) => {
        if (add) {
          element.classList.add(className);
        } else {
          element.classList.remove(className);
        }
      });
  };

  const findScrollableAncestor = (element: Element): HTMLElement | null => {
    let current = element as HTMLElement | null;

    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      const isScrollable =
        (overflowY === "auto" ||
          overflowY === "scroll" ||
          overflow === "auto" ||
          overflow === "scroll") &&
        current.scrollHeight > current.clientHeight;

      if (isScrollable) {
        return current;
      }

      current = current.parentElement;
    }

    return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
  };

  const applyCurrentHighlight = (element: Element) => {
    element.classList.add("current-match");

    if (element.classList.contains("record-search-ellipsis-highlight")) {
      toggleClassList(element, ellipsisCurrentClass, true);
      return;
    }

    if (!element.classList.contains("record-search-highlight")) return;

    if (element.classList.contains("key-match")) {
      toggleClassList(element, highlightCurrentKeyClass, true);
      return;
    }

    if (element.classList.contains("value-match")) {
      toggleClassList(element, highlightCurrentValueClass, true);
    }
  };

  const clearCurrentHighlight = (element: Element) => {
    element.classList.remove("current-match");
    toggleClassList(
      element,
      `${highlightCurrentKeyClass} ${highlightCurrentValueClass} ${ellipsisCurrentClass}`,
      false,
    );
  };

  const buildFieldPath = (element: Element, recordElement: Element): string[] => {
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

  const performSearch = (searchText: string, expandedRecords: Set<number>): SearchResult[] => {
    const term = searchText.trim();
    if (!term || term.length < 1) {
      clearHighlights();
      return [];
    }

    const results: SearchResult[] = [];
    const searchLower = term.toLowerCase();

    const recordElements = document.querySelectorAll("[data-record-index]");

    recordElements.forEach((recordElement) => {
      const recordIndexAttr = recordElement.getAttribute("data-record-index");
      if (!recordIndexAttr) return;

      const recordIndex = parseInt(recordIndexAttr, 10);

      const headerElements = recordElement.querySelectorAll(".record-header [data-searchable]");

      headerElements.forEach((element) => {
        const searchableText = element.getAttribute("data-searchable");
        const fieldName = element.getAttribute("data-field");

        if (!searchableText || !fieldName) return;

        const searchableTextLower = searchableText.toLowerCase();
        if (searchableTextLower.includes(searchLower)) {
          const matchIndex = searchableTextLower.indexOf(searchLower);

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

      if (expandedRecords.has(recordIndex)) {
        const allSearchableElements = recordElement.querySelectorAll("[data-searchable]");
        const processedElements = new Set<Element>();

        allSearchableElements.forEach((element) => {
          if (processedElements.has(element) || element.closest(".record-header")) {
            return;
          }
          processedElements.add(element);

          const searchableText = element.getAttribute("data-searchable");
          if (!searchableText) return;

          const fieldPath = buildFieldPath(element, recordElement);
          if (fieldPath.length === 0) return;

          const searchableTextLower = searchableText.toLowerCase();
          if (searchableTextLower.includes(searchLower)) {
            const matchIndex = searchableTextLower.indexOf(searchLower);

            const isLabelElement = element.classList.contains("detail-label");
            const matchType: "key" | "value" = isLabelElement ? "key" : "value";

            results.push({
              recordIndex,
              fieldPath,
              displayText: isLabelElement ? fieldPath[fieldPath.length - 1] : searchableText,
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
      const searchableText = result.element.getAttribute("data-searchable") || "";
      const uniqueKey = `${result.recordIndex}-${result.fieldPath.join(".")}-${result.matchType}-${searchableText}`;

      if (!uniqueResultMap.has(uniqueKey)) {
        uniqueResultMap.set(uniqueKey, result);
      }
    });

    const deduplicatedResults = Array.from(uniqueResultMap.values());

    deduplicatedResults.sort((a, b) => {
      const levelA = parseInt(a.element.getAttribute("data-level") || "0");
      const levelB = parseInt(b.element.getAttribute("data-level") || "0");

      if (levelA !== levelB) {
        return levelA - levelB;
      }

      const fieldA =
        a.element.getAttribute("data-field") || a.fieldPath[a.fieldPath.length - 1] || "";
      const fieldB =
        b.element.getAttribute("data-field") || b.fieldPath[b.fieldPath.length - 1] || "";

      if (fieldA !== fieldB) {
        if (fieldA === "id") return -1;
        if (fieldB === "id") return 1;
        return fieldA.localeCompare(fieldB);
      }

      const depthA = a.fieldPath.length;
      const depthB = b.fieldPath.length;

      if (depthA !== depthB) {
        return depthA - depthB;
      }

      return a.recordIndex - b.recordIndex;
    });

    setAllSearchResults(deduplicatedResults);
    highlightAllResults(deduplicatedResults);
    return deduplicatedResults;
  };

  const checkAndShowEllipsis = (element: Element, searchText: string, isCurrent: boolean) => {
    const style = window.getComputedStyle(element);
    if (style.textOverflow !== "ellipsis" && style.overflow !== "hidden") return;

    const textContent = element.textContent || "";
    if (textContent.length < 30) return;

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

    const ellipsisIndicator = document.createElement("span");
    ellipsisIndicator.className = `${ellipsisBaseClass}${isCurrent ? ` current-match ${ellipsisCurrentClass}` : ""}`;
    ellipsisIndicator.textContent = "● ";
    ellipsisIndicator.title = t("devtools.record_search.match_found", [searchText]);

    const parent = element.parentElement;
    if (parent) {
      parent.insertBefore(ellipsisIndicator, element);
    }
  };

  const highlightTextInTargetElement = (
    targetElement: Element,
    searchText: string,
    result: SearchResult,
    isCurrent: boolean,
  ) => {
    if (targetElement.querySelector(".record-search-highlight")) {
      return;
    }

    const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT, null);

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const nodeText = textNode.textContent || "";
      const matchIndex = nodeText.toLowerCase().indexOf(searchText.toLowerCase());

      if (matchIndex !== -1) {
        const beforeText = nodeText.substring(0, matchIndex);
        const matchText = nodeText.substring(matchIndex, matchIndex + searchText.length);
        const afterText = nodeText.substring(matchIndex + searchText.length);

        const parent = textNode.parentNode;
        if (parent && parent.nodeType === Node.ELEMENT_NODE) {
          const parentElement = parent as Element;
          if (parentElement.classList.contains("record-search-highlight")) {
            return;
          }

          const highlightNode = document.createElement("mark");
          highlightNode.className = `${highlightBaseClass} ${result.matchType === "key" ? `key-match ${highlightKeyClass}` : `value-match ${highlightValueClass}`}${isCurrent ? ` current-match ${result.matchType === "key" ? highlightCurrentKeyClass : highlightCurrentValueClass}` : ""}`;
          highlightNode.textContent = matchText;

          if (beforeText) parentElement.insertBefore(document.createTextNode(beforeText), textNode);
          parentElement.insertBefore(highlightNode, textNode);
          if (afterText) parentElement.insertBefore(document.createTextNode(afterText), textNode);
          parentElement.removeChild(textNode);
        }
        break;
      }
    }
  };

  const highlightTextInElement = (
    element: Element,
    result: SearchResult,
    isCurrent: boolean = false,
    allowHighlight: boolean = true,
  ) => {
    const searchText = result.displayText.substring(result.matchStart, result.matchEnd);

    const targetElement =
      result.matchType === "key" ? element.querySelector(".detail-label") || element : element;

    if (isCurrent && result.matchType === "value") {
      checkAndShowEllipsis(element, searchText, true);
    }

    if (allowHighlight) {
      highlightTextInTargetElement(targetElement, searchText, result, isCurrent);
    }
  };

  const highlightAllResults = (results: SearchResult[]) => {
    clearHighlights();
    results.forEach((result) => {
      highlightTextInElement(result.element, result, false);
    });
  };

  const navigateToResult = (result: SearchResult) => {
    setCurrentSearchResult(result);

    document
      .querySelectorAll(".record-search-highlight, .record-search-ellipsis-highlight")
      .forEach((el) => {
        clearCurrentHighlight(el);
      });

    document.querySelectorAll(".record-search-ellipsis-highlight").forEach((el) => el.remove());

    const elementRect = result.element.getBoundingClientRect();
    const scrollContainer = findScrollableAncestor(result.element);

    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollTop =
        scrollContainer.scrollTop + elementRect.top - containerRect.top - containerRect.height / 3;

      scrollContainer.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "auto",
      });
    } else {
      (result.element as HTMLElement).scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    }

    highlightTextInElement(result.element, result, true, false);

    const searchText = result.displayText
      .substring(result.matchStart, result.matchEnd)
      .toLowerCase();

    const highlights = result.element.querySelectorAll(
      ".record-search-highlight, .record-search-ellipsis-highlight",
    );
    let highlightFound = false;

    for (const highlight of highlights) {
      if (
        highlight.classList.contains("record-search-ellipsis-highlight") ||
        highlight.textContent?.toLowerCase() === searchText
      ) {
        applyCurrentHighlight(highlight);
        highlightFound = true;
        break;
      }
    }

    if (!highlightFound) {
      highlightTextInElement(result.element, result, true, true);

      const refreshedHighlights = result.element.querySelectorAll(
        ".record-search-highlight, .record-search-ellipsis-highlight",
      );
      for (const highlight of refreshedHighlights) {
        if (
          highlight.classList.contains("record-search-ellipsis-highlight") ||
          highlight.textContent?.toLowerCase() === searchText
        ) {
          applyCurrentHighlight(highlight);
          highlightFound = true;
          break;
        }
      }
    }

    if (!highlightFound) {
      const parentHighlights =
        result.element.parentElement?.querySelectorAll(
          ".record-search-highlight, .record-search-ellipsis-highlight",
        ) || [];
      for (const highlight of parentHighlights) {
        if (
          highlight.classList.contains("record-search-ellipsis-highlight") ||
          (highlight.textContent?.toLowerCase() === searchText &&
            highlight.contains(result.element))
        ) {
          applyCurrentHighlight(highlight);
          break;
        }
      }
    }
  };

  const clearHighlights = () => {
    document
      .querySelectorAll(".record-search-highlight, .record-search-ellipsis-highlight")
      .forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          if (el.classList.contains("record-search-ellipsis-highlight")) {
            parent.removeChild(el);
          } else {
            parent.replaceChild(document.createTextNode(el.textContent || ""), el);
          }
          parent.normalize();
        }
      });
    setCurrentSearchResult(null);
  };

  return {
    currentSearchResult,
    allSearchResults,
    performSearch,
    navigateToResult,
    clearHighlights,
  };
};

interface RecordSearchProps {
  expandedRecords: () => Set<number>;
}

export const RecordSearch = (props: RecordSearchProps) => {
  const { clearHighlights, performSearch, navigateToResult } = useRecordSearch();

  const [searchTerm, setSearchTerm] = createSignal("");
  const [isVisible, setIsVisible] = createSignal(false);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();

  const searchResults = createMemo(() => {
    return performSearch(searchTerm(), props.expandedRecords());
  });

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term);
    setCurrentIndex(0);
  }, 500);

  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsVisible(true);
        setTimeout(() => inputRef()?.focus(), 50);
        return;
      }

      if (e.key === "Escape" && isVisible()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleClose();
        return;
      }

      if (isVisible() && searchResults().length > 0) {
        if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "g")) {
          e.preventDefault();
          setCurrentIndex((currentIndex() + 1) % searchResults().length);
          navigateToResult(searchResults()[currentIndex()]);
          return;
        }
        if (e.key === "ArrowUp" || (e.ctrlKey && e.shiftKey && e.key === "G")) {
          e.preventDefault();
          setCurrentIndex(currentIndex() === 0 ? searchResults().length - 1 : currentIndex() - 1);
          navigateToResult(searchResults()[currentIndex()]);
          return;
        }

        if (e.key === "Enter" && document.activeElement === inputRef()) {
          e.preventDefault();
          setCurrentIndex((currentIndex() + 1) % searchResults().length);
          navigateToResult(searchResults()[currentIndex()]);
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown, true));
  });

  createEffect(() => {
    if (searchResults().length > 0) {
      if (currentIndex() < searchResults().length) {
        navigateToResult(searchResults()[currentIndex()]);
      }
    }
  });

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    debouncedSearch(target.value);
  };

  const handleClose = () => {
    setIsVisible(false);
    setSearchTerm("");
    setCurrentIndex(0);
    clearHighlights();
  };

  const handleNext = () => {
    if (searchResults().length > 0) {
      setCurrentIndex((currentIndex() + 1) % searchResults().length);
      navigateToResult(searchResults()[currentIndex()]);
    }
  };

  const handlePrevious = () => {
    if (searchResults().length > 0) {
      setCurrentIndex(currentIndex() === 0 ? searchResults().length - 1 : currentIndex() - 1);
      navigateToResult(searchResults()[currentIndex()]);
    }
  };

  return (
    <Show when={isVisible()}>
      <div class="record-search-bar animate-record-search-in sticky top-0 z-10">
        <div class="flex items-center gap-2 px-2 py-1.5">
          <span class="text-base-content/60">
            <HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.5} />
          </span>
          <Input
            ref={setInputRef}
            type="text"
            placeholder={t("devtools.record_search.placeholder")}
            class="min-w-0"
            size="sm"
            variant="ghost"
            fullWidth
            onInput={handleInputChange}
          />
          <div class="flex items-center gap-1">
            {searchResults().length > 0 && (
              <span class="text-xs whitespace-nowrap text-base-content/70">
                {currentIndex() + 1} {t("devtools.record_search.of")} {searchResults().length}
                {searchResults().some((r) => r.matchType === "key") &&
                searchResults().some((r) => r.matchType === "value") ? (
                  <span class="ms-1 text-base-content/60">
                    ({searchResults().filter((r) => r.matchType === "key").length}{" "}
                    {t("devtools.record_search.keys")},{" "}
                    {searchResults().filter((r) => r.matchType === "value").length}{" "}
                    {t("devtools.record_search.values")})
                  </span>
                ) : null}
              </span>
            )}
            <IconButton
              size="xs"
              variant="ghost"
              label={t("devtools.record_search.prev_hint")}
              onClick={handlePrevious}
              disabled={searchResults().length === 0}
              icon={
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
            />
            <IconButton
              size="xs"
              variant="ghost"
              label={t("devtools.record_search.next_hint")}
              onClick={handleNext}
              disabled={searchResults().length === 0}
              icon={
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
            />
            <IconButton
              size="xs"
              variant="ghost"
              color="error"
              label={t("devtools.record_search.close_hint")}
              onClick={handleClose}
              icon={
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
            />
          </div>
        </div>
      </div>
    </Show>
  );
};
