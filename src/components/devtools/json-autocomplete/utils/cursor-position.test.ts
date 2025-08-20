import { describe, expect, test } from "bun:test"
import { adjustDropdownPosition } from "./cursor-position"

describe("cursor-position utilities", () => {
    test("adjustDropdownPosition should position dropdown below cursor by default", () => {
        const dropdownRect = { width: 320, height: 300 }
        const targetPosition = { top: 50, left: 100, lineHeight: 20 }
        const containerRect = {
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
        } as DOMRect

        const result = adjustDropdownPosition(
            dropdownRect,
            targetPosition,
            containerRect
        )

        expect(result.top).toBe(74) // 50 + 20 + 4 (lineHeight + margin)
        expect(result.left).toBe(100) // Same as target
    })

    test("adjustDropdownPosition should position dropdown above cursor when no space below", () => {
        const dropdownRect = { width: 320, height: 300 }
        const targetPosition = { top: 350, left: 100, lineHeight: 20 } // Near bottom
        const containerRect = {
            top: 0,
            left: 0,
            right: 800,
            bottom: 400, // Limited height
        } as DOMRect

        const result = adjustDropdownPosition(
            dropdownRect,
            targetPosition,
            containerRect
        )

        expect(result.top).toBe(46) // 350 - 300 - 4 (above cursor)
        expect(result.left).toBe(100)
    })

    test("adjustDropdownPosition should adjust horizontal position when dropdown would overflow", () => {
        const dropdownRect = { width: 320, height: 300 }
        const targetPosition = { top: 50, left: 700, lineHeight: 20 } // Near right edge
        const containerRect = {
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
        } as DOMRect

        const result = adjustDropdownPosition(
            dropdownRect,
            targetPosition,
            containerRect
        )

        expect(result.top).toBe(74) // Normal vertical position
        expect(result.left).toBe(476) // 800 - 320 - 4 (adjusted to fit)
    })

    test("adjustDropdownPosition should handle left edge overflow", () => {
        const dropdownRect = { width: 320, height: 300 }
        const targetPosition = { top: 50, left: -50, lineHeight: 20 } // Negative position
        const containerRect = {
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
        } as DOMRect

        const result = adjustDropdownPosition(
            dropdownRect,
            targetPosition,
            containerRect
        )

        expect(result.top).toBe(74)
        expect(result.left).toBe(4) // Adjusted to container left + margin
    })

    test("adjustDropdownPosition should handle extreme cases where dropdown doesn't fit anywhere", () => {
        const dropdownRect = { width: 320, height: 300 }
        const targetPosition = { top: 50, left: 100, lineHeight: 20 }
        const containerRect = {
            top: 100, // Very limited space
            left: 0,
            right: 200, // Very narrow
            bottom: 150, // Very short
        } as DOMRect

        const result = adjustDropdownPosition(
            dropdownRect,
            targetPosition,
            containerRect
        )

        // Should position at container boundaries with margins
        expect(result.top).toBe(104) // container.top + 4
        expect(result.left).toBe(4) // Adjusted to fit in narrow container
    })

    test("adjustDropdownPosition should handle zero-sized containers gracefully", () => {
        const dropdownRect = { width: 320, height: 300 }
        const targetPosition = { top: 50, left: 100, lineHeight: 20 }
        const containerRect = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        } as DOMRect

        const result = adjustDropdownPosition(
            dropdownRect,
            targetPosition,
            containerRect
        )

        // Should fallback to minimal positions
        expect(result.top).toBe(4)
        expect(result.left).toBe(4)
    })
})
