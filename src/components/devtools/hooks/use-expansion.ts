import { useState } from "preact/hooks"

export const useExpansion = (
    onExpandToggle?: (index: number) => void,
    externalExpandedRecords?: Set<number>
) => {
    const [localExpandedRecords, setLocalExpandedRecords] = useState<
        Set<number>
    >(new Set())

    const currentExpanded = onExpandToggle
        ? externalExpandedRecords || new Set()
        : localExpandedRecords

    const toggleExpansion = (index: number) => {
        if (onExpandToggle) {
            onExpandToggle(index)
        } else {
            const newExpanded = new Set(localExpandedRecords)
            if (newExpanded.has(index)) {
                newExpanded.delete(index)
            } else {
                newExpanded.add(index)
            }
            setLocalExpandedRecords(newExpanded)
        }
    }

    return {
        currentExpanded,
        toggleExpansion,
    }
}
