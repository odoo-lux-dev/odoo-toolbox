import { useCallback } from "preact/hooks"
import {
    errorSignal,
    loadingSignal,
    setError,
    setLoading,
    setViewInfo,
    viewInfoSignal,
} from "@/contexts/technical-sidebar-signals"
import { Logger } from "@/services/logger"
import {
    DebugButtonInfo,
    DebugFieldInfo,
    EnhancedTechnicalButtonInfo,
    EnhancedTechnicalFieldInfo,
    ViewInfo,
    WebsiteInfo,
} from "@/types"
import { isOnSpecificRecordPage } from "@/utils/utils"

export const useViewInfo = () => {
    const extractWebsiteInfo = useCallback((): WebsiteInfo | null => {
        const extractFromHtml = (
            htmlElement: HTMLElement
        ): WebsiteInfo | null => {
            const websiteId = htmlElement.getAttribute("data-website-id")
            if (!websiteId) {
                return null
            }

            // Extract website information from data-* attributes
            const mainObject =
                htmlElement.getAttribute("data-main-object") || ""
            const viewXmlId = htmlElement.getAttribute("data-view-xmlid")
            const viewId = htmlElement.getAttribute("data-viewid")
            const isPublished = htmlElement.getAttribute("data-is-published")
            const canOptimizeSeo = htmlElement.getAttribute(
                "data-can-optimize-seo"
            )
            const canPublish = htmlElement.getAttribute("data-can-publish")
            const isEditable = htmlElement.getAttribute("data-editable")
            const isLogged = htmlElement.getAttribute("data-logged")
            const language = htmlElement.getAttribute("lang")

            return {
                websiteId,
                mainObject,
                viewXmlId,
                viewId,
                isPublished:
                    isPublished === "True"
                        ? true
                        : isPublished === "False"
                          ? false
                          : null,
                canOptimizeSeo:
                    canOptimizeSeo === "True"
                        ? true
                        : canOptimizeSeo === "False"
                          ? false
                          : null,
                canPublish:
                    canPublish === "True"
                        ? true
                        : canPublish === "False"
                          ? false
                          : null,
                isEditable:
                    isEditable === "1"
                        ? true
                        : isEditable === "0"
                          ? false
                          : null,
                isLogged: isLogged === "true",
                language,
            }
        }

        // 1. First check in the main document
        const htmlElement = document.documentElement
        const mainDocumentInfo = extractFromHtml(htmlElement)
        if (mainDocumentInfo) {
            return mainDocumentInfo
        }

        // 2. If not found, check in iframes (Odoo editor mode)
        const iframes = document.querySelectorAll("iframe")
        for (const iframe of iframes) {
            try {
                // Check if iframe is accessible (same origin)
                const iframeDocument =
                    iframe.contentDocument || iframe.contentWindow?.document
                if (iframeDocument && iframeDocument.documentElement) {
                    const iframeInfo = extractFromHtml(
                        iframeDocument.documentElement
                    )
                    if (iframeInfo) {
                        return iframeInfo
                    }
                }
            } catch (error) {
                Logger.debug("Cannot access iframe content (CORS):", error)
            }
        }

        return null
    }, [])

    const extractDebugButtonInfo = useCallback(
        (
            buttonName: string,
            buttonType: "object" | "action"
        ): DebugButtonInfo | null => {
            // Search for all elements with data-tooltip-info
            const tooltipElements = document.querySelectorAll(
                "[data-tooltip-info]"
            )

            for (const element of tooltipElements) {
                try {
                    const tooltipInfo =
                        element.getAttribute("data-tooltip-info")
                    if (!tooltipInfo) continue

                    const decodedInfo = tooltipInfo.replace(/&quot;/g, '"')
                    const parsed = JSON.parse(decodedInfo)

                    // Check if it's a button tooltip and matches our criteria
                    if (
                        parsed.button?.name === buttonName &&
                        parsed.button?.type === buttonType
                    ) {
                        return {
                            name: parsed.button.name,
                            type: parsed.button.type,
                            string: parsed.button.string,
                            invisible: parsed.button.invisible,
                            context: parsed.context,
                            confirm: parsed.button.confirm,
                            help: parsed.button.help,
                            icon: parsed.button.icon,
                        }
                    }
                } catch {
                    // Continue the loop
                }
            }

            return null
        },
        []
    )

    const extractDebugFieldInfo = useCallback(
        (fieldName: string): DebugFieldInfo | null => {
            // Search for all elements with data-tooltip-info
            const tooltipElements = document.querySelectorAll(
                "[data-tooltip-info]"
            )

            for (const element of tooltipElements) {
                try {
                    const tooltipInfo =
                        element.getAttribute("data-tooltip-info")
                    if (!tooltipInfo) continue

                    const decodedInfo = tooltipInfo.replace(/&quot;/g, '"')
                    const parsed = JSON.parse(decodedInfo)

                    // Check if it's the right field
                    if (parsed.field?.name === fieldName) {
                        return {
                            name: parsed.field.name,
                            label: parsed.field.label,
                            type: parsed.field.type,
                            widget: parsed.field.widget,
                            context: parsed.field.context,
                            domain: parsed.field.domain,
                            invisible: parsed.field.invisible,
                            column_invisible: parsed.field.column_invisible,
                            readonly: parsed.field.readonly,
                            required: parsed.field.required,
                            changeDefault: parsed.field.changeDefault,
                            relation: parsed.field.relation,
                            compute: parsed.field.compute,
                            related: parsed.field.related,
                            store: parsed.field.store,
                            selection: parsed.field.selection,
                        }
                    }
                } catch {
                    // Continue the loop
                }
            }

            return null
        },
        []
    )

    const extractFieldInfo = useCallback(
        (fieldElement: Element): EnhancedTechnicalFieldInfo => {
            const fieldName =
                fieldElement.getAttribute("name") ||
                fieldElement.getAttribute("data-name") ||
                "unknown"

            // Try first the debug data
            const debugInfo = extractDebugFieldInfo(fieldName)
            let fieldType = "unknown"
            let label = ""

            if (debugInfo) {
                // Use debug information (more precise)
                fieldType = debugInfo.type
                label = debugInfo.label

                // Apply replacements for consistency
                switch (fieldType) {
                    case "many2one":
                        fieldType = "m2o"
                        break
                    case "many2many":
                        fieldType = "m2m"
                        break
                    case "one2many":
                        fieldType = "o2m"
                        break
                }
            } else {
                // Fallback to old method
                const classList = Array.from(fieldElement.classList)

                if (classList.includes("o_field_cell")) {
                    const listTypeClass = classList.find((cls) =>
                        cls.startsWith("o_list_")
                    )
                    if (listTypeClass) {
                        let type = listTypeClass.replace("o_list_", "")
                        switch (type) {
                            case "many2one":
                                type = "m2o"
                                break
                            case "many2many":
                                type = "m2m"
                                break
                            case "one2many":
                                type = "o2m"
                                break
                        }
                        fieldType = type
                    } else {
                        fieldType = "cell"
                    }
                } else if (classList.includes("o_field_widget")) {
                    const widgetTypeClass = classList.find(
                        (cls) =>
                            cls.startsWith("o_field_") &&
                            cls !== "o_field_widget"
                    )

                    if (widgetTypeClass) {
                        let type = widgetTypeClass.replace("o_field_", "")
                        switch (type) {
                            case "many2one":
                                type = "m2o"
                                break
                            case "many2many":
                                type = "m2m"
                                break
                            case "one2many":
                                type = "o2m"
                                break
                        }
                        fieldType = type
                    } else {
                        const typeClass = classList.find((cls) =>
                            cls.startsWith("o_field_")
                        )
                        if (typeClass) {
                            fieldType = typeClass.replace("o_field_", "")
                        }
                    }
                } else {
                    const typeClass = classList.find((cls) =>
                        cls.startsWith("o_field_")
                    )
                    if (typeClass) {
                        fieldType = typeClass.replace("o_field_", "")
                    }
                }

                const parentContainer = fieldElement.closest(
                    ".o_cell, .o_wrap_field, .o_field_wrapper, .o_list_table, tr"
                )

                if (parentContainer) {
                    let labelElement = parentContainer.querySelector(
                        ".o_form_label, label"
                    )

                    if (
                        !labelElement &&
                        fieldElement.classList.contains("o_field_cell")
                    ) {
                        const row = fieldElement.closest("tr")
                        if (row) {
                            const cellIndex = Array.from(row.children).indexOf(
                                fieldElement as HTMLElement
                            )
                            const table = fieldElement.closest("table")
                            const headerRow = table?.querySelector("thead tr")
                            if (headerRow && cellIndex >= 0) {
                                const headerCell = headerRow.children[cellIndex]
                                labelElement =
                                    headerCell?.querySelector(
                                        ".o_column_title, span"
                                    ) || headerCell
                            }
                        }
                    }

                    label = labelElement?.textContent?.trim() || ""
                }
            }

            let value = ""
            const input = fieldElement.querySelector(
                'input:not([type="hidden"]), textarea, select'
            )
            if (input) {
                value = (input as HTMLInputElement).value
            } else {
                if (fieldElement.classList.contains("o_field_cell")) {
                    value = fieldElement.textContent?.trim() || ""
                } else {
                    const textElement = fieldElement.querySelector(
                        "span:not(.fa), div:last-child"
                    )
                    value = textElement?.textContent?.trim() || ""
                }
            }

            let isRequired = false
            let isReadonly = false
            let canBeRequired = false
            let canBeReadonly = false

            if (debugInfo) {
                // Manage dynamic conditions
                // Python True/False values can be booleans or strings "True"/"False"/"1"/"0"
                if (typeof debugInfo.required === "boolean") {
                    isRequired = debugInfo.required
                    canBeRequired = debugInfo.required
                } else if (
                    debugInfo.required === "True" ||
                    debugInfo.required === "False" ||
                    debugInfo.required === "1" ||
                    debugInfo.required === "0"
                ) {
                    isRequired =
                        debugInfo.required === "True" ||
                        debugInfo.required === "1"
                    canBeRequired =
                        debugInfo.required === "True" ||
                        debugInfo.required === "1"
                } else if (
                    debugInfo.required &&
                    typeof debugInfo.required === "string"
                ) {
                    isRequired = fieldElement.classList.contains(
                        "o_required_modifier"
                    )
                    canBeRequired = true
                }

                if (typeof debugInfo.readonly === "boolean") {
                    isReadonly = debugInfo.readonly
                    canBeReadonly = debugInfo.readonly
                } else if (
                    debugInfo.readonly === "True" ||
                    debugInfo.readonly === "False" ||
                    debugInfo.readonly === "1" ||
                    debugInfo.readonly === "0"
                ) {
                    isReadonly =
                        debugInfo.readonly === "True" ||
                        debugInfo.readonly === "1"
                    canBeReadonly =
                        debugInfo.readonly === "True" ||
                        debugInfo.readonly === "1"
                } else if (
                    debugInfo.readonly &&
                    typeof debugInfo.readonly === "string"
                ) {
                    isReadonly = fieldElement.classList.contains(
                        "o_readonly_modifier"
                    )
                    canBeReadonly = true
                }

                // Fallback to CSS classes if values are not defined or False/0
                if (
                    debugInfo.required === null ||
                    debugInfo.required === undefined ||
                    debugInfo.required === false ||
                    debugInfo.required === "False" ||
                    debugInfo.required === "0"
                ) {
                    isRequired = fieldElement.classList.contains(
                        "o_required_modifier"
                    )
                    canBeRequired = isRequired
                }
                if (
                    debugInfo.readonly === null ||
                    debugInfo.readonly === undefined ||
                    debugInfo.readonly === false ||
                    debugInfo.readonly === "False" ||
                    debugInfo.readonly === "0"
                ) {
                    isReadonly = fieldElement.classList.contains(
                        "o_readonly_modifier"
                    )
                    canBeReadonly = isReadonly
                }
            } else {
                isRequired = fieldElement.classList.contains(
                    "o_required_modifier"
                )
                isReadonly = fieldElement.classList.contains(
                    "o_readonly_modifier"
                )
                canBeRequired = isRequired
                canBeReadonly = isReadonly
            }

            return {
                name: fieldName,
                type: fieldType,
                label,
                value:
                    value && value.length > 50
                        ? value.substring(0, 50) + "..."
                        : value,
                isRequired,
                isReadonly,
                canBeRequired,
                canBeReadonly,
                debugInfo: debugInfo || undefined,
                hasDebugData: !!debugInfo,
            }
        },
        [extractDebugFieldInfo]
    )

    const extractButtonInfo = useCallback(
        (buttonElement: Element): EnhancedTechnicalButtonInfo => {
            const buttonType = buttonElement.getAttribute("type") as
                | "object"
                | "action"

            // Always use the name attribute from DOM for simplicity
            const buttonName =
                buttonElement.getAttribute("name") ||
                buttonElement.getAttribute("id") ||
                "unknown"

            // Try to get debug info for additional metadata
            const debugInfo = extractDebugButtonInfo(buttonName, buttonType)
            let label = ""
            let isVisible = true

            if (debugInfo) {
                // Use debug information (more precise)
                label = debugInfo.string || ""

                // Handle visibility from invisible attribute
                if (typeof debugInfo.invisible === "boolean") {
                    isVisible = !debugInfo.invisible
                } else if (
                    debugInfo.invisible === "True" ||
                    debugInfo.invisible === "False" ||
                    debugInfo.invisible === "1" ||
                    debugInfo.invisible === "0"
                ) {
                    isVisible = !(
                        debugInfo.invisible === "True" ||
                        debugInfo.invisible === "1"
                    )
                } else if (
                    debugInfo.invisible &&
                    typeof debugInfo.invisible === "string"
                ) {
                    // Dynamic condition - check if button is actually visible
                    isVisible = !buttonElement.hasAttribute("invisible")
                }
            } else {
                // Fallback to extracting from DOM
                const spanElement = buttonElement.querySelector("span")
                label = spanElement?.textContent?.trim() || ""
                isVisible = !buttonElement.hasAttribute("invisible")
            }

            const hotkey =
                buttonElement.getAttribute("data-hotkey") || undefined

            return {
                name: buttonName,
                type: buttonType,
                label,
                isVisible,
                hotkey,
                debugInfo: debugInfo || undefined,
                hasDebugData: !!debugInfo,
            }
        },
        [extractDebugButtonInfo]
    )

    const fetchViewInfo = useCallback((): ViewInfo => {
        const odooWindowObject = window.odoo
        if (!odooWindowObject) {
            throw new Error("Odoo object not found")
        }

        let currentModel: string | undefined
        let currentRecordId: number | undefined
        let viewType: string | undefined
        let actionContext: string | undefined
        let actionName: string | undefined
        let actionDomain: string | undefined
        let actionXmlId: string | undefined
        let actionType: string | undefined

        try {
            const controller =
                odooWindowObject.__WOWL_DEBUG__?.root?.actionService
                    ?.currentController
            currentModel = controller?.props?.resModel
            viewType = controller?.view?.type
            actionName = controller?.action?.name
            actionXmlId = controller?.action?.xml_id
            actionType = controller?.action?.type

            if (
                controller?.action?.domain &&
                Array.isArray(controller.action.domain) &&
                controller.action.domain.length > 0
            ) {
                actionDomain = JSON.stringify(controller.action.domain)
            }

            if (
                controller?.action?.context &&
                typeof controller.action.context === "object" &&
                !Array.isArray(controller.action.context) &&
                Object.keys(controller.action.context).length > 0
            ) {
                actionContext = JSON.stringify(controller.action.context)
            }

            if (isOnSpecificRecordPage()) {
                const localState = controller?.getLocalState?.()
                currentRecordId = localState?.resId || localState?.currentId
            }
        } catch (error) {
            Logger.warn("Could not get current record info:", error)
        }

        const fieldElements = document.querySelectorAll(
            ".o_field_widget[name], .o_field_widget[data-name], .o_field_cell[name], .o_field_cell[data-name]"
        )
        const technicalFields: EnhancedTechnicalFieldInfo[] = []
        const seenFields = new Set<string>()

        fieldElements.forEach((element) => {
            try {
                const fieldName =
                    element.getAttribute("name") ||
                    element.getAttribute("data-name")
                if (!fieldName || seenFields.has(fieldName)) return

                const fieldInfo = extractFieldInfo(element)
                seenFields.add(fieldName)
                technicalFields.push(fieldInfo)
            } catch (error) {
                Logger.warn(`Error extracting field info:`, error)
            }
        })

        technicalFields.sort((a, b) => a.name.localeCompare(b.name))

        // Extract buttons information
        const buttonElements = document.querySelectorAll(
            'button[type="object"], button[type="action"]'
        )
        const technicalButtons: EnhancedTechnicalButtonInfo[] = []
        const seenButtons = new Set<string>()

        buttonElements.forEach((element) => {
            try {
                const buttonType = element.getAttribute("type") as
                    | "object"
                    | "action"
                const buttonName =
                    buttonType === "action"
                        ? element.getAttribute("id") ||
                          element.getAttribute("name")
                        : element.getAttribute("name") ||
                          element.getAttribute("id")

                if (
                    !buttonName ||
                    !buttonType ||
                    seenButtons.has(`${buttonType}:${buttonName}`)
                )
                    return

                const buttonInfo = extractButtonInfo(element)
                seenButtons.add(`${buttonType}:${buttonName}`)
                technicalButtons.push(buttonInfo)
            } catch (error) {
                Logger.warn(`Error extracting button info:`, error)
            }
        })

        technicalButtons.sort((a, b) => a.name.localeCompare(b.name))

        // Extract website information if on a website
        const websiteInfo = extractWebsiteInfo() || undefined

        return {
            currentModel,
            currentRecordId,
            technicalFields,
            technicalButtons,
            viewType,
            totalFields: technicalFields.length,
            totalButtons: technicalButtons.length,
            websiteInfo,
            actionContext,
            actionName,
            actionDomain,
            actionXmlId,
            actionType,
        }
    }, [extractFieldInfo, extractButtonInfo, extractWebsiteInfo])

    const extractSingleFieldInfo = useCallback(
        (element: HTMLElement): EnhancedTechnicalFieldInfo | null => {
            if (!element) return null

            // The selected element must already be validated by the selector, so we can
            // directly extract its information without going up to the parents

            // Check that the element meets the criteria of an Odoo field
            const hasFieldWidget = element.classList.contains("o_field_widget")
            const hasFieldCell = element.classList.contains("o_field_cell")
            const hasNameAttr =
                element.hasAttribute("name") ||
                element.hasAttribute("data-name")

            if (!(hasFieldWidget || hasFieldCell) || !hasNameAttr) {
                Logger.debug(
                    "Selected element doesn't match field criteria - should not happen if selector works correctly"
                )
                return null
            }

            try {
                const fieldInfo = extractFieldInfo(element as Element)
                return fieldInfo
            } catch (error) {
                Logger.error(
                    "Failed to extract field info from element:",
                    error
                )
                return null
            }
        },
        [extractFieldInfo]
    )

    const extractSingleButtonInfo = useCallback(
        (element: HTMLElement): EnhancedTechnicalButtonInfo | null => {
            if (!element) return null

            // Check that the element meets the criteria of an Odoo button
            const isButton = element.tagName.toLowerCase() === "button"
            const hasType = element.hasAttribute("type")
            const buttonType = element.getAttribute("type")
            const isValidType =
                buttonType === "object" || buttonType === "action"
            const hasNameOrId =
                element.hasAttribute("name") || element.hasAttribute("id")

            if (!isButton || !hasType || !isValidType || !hasNameOrId) {
                Logger.debug(
                    "Selected element doesn't match button criteria - should not happen if selector works correctly"
                )
                return null
            }

            try {
                const buttonInfo = extractButtonInfo(element as Element)
                return buttonInfo
            } catch (error) {
                Logger.error(
                    "Failed to extract button info from element:",
                    error
                )
                return null
            }
        },
        [extractButtonInfo]
    )

    const refresh = useCallback(() => {
        setLoading(true)
        setError(null)

        try {
            const info = fetchViewInfo()
            setViewInfo(info)
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Failed to load view information"
            Logger.error("Failed to get view info:", err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [fetchViewInfo])

    return {
        viewInfo: viewInfoSignal.value,
        loading: loadingSignal.value,
        error: errorSignal.value,
        refresh,
        extractSingleFieldInfo,
        extractSingleButtonInfo,
    }
}
