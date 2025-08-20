import { useRef, useState } from "preact/hooks"

interface Position {
    top: number
    left: number
}

export const usePortalTooltip = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState<Position>({ top: 0, left: 0 })
    const anchorRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const showTooltip = () => {
        setPosition({ top: -9999, left: -9999 })
        setIsVisible(true)

        setTimeout(() => {
            if (anchorRef.current && tooltipRef.current) {
                const anchorRect = anchorRef.current.getBoundingClientRect()
                const tooltipRect = tooltipRef.current.getBoundingClientRect()

                const positions = {
                    right: {
                        top: anchorRect.top - 5,
                        left: anchorRect.right + 8,
                    },
                    left: {
                        top: anchorRect.top - 5,
                        left: anchorRect.left - tooltipRect.width - 8,
                    },
                    bottom: {
                        top: anchorRect.bottom + 8,
                        left: anchorRect.left,
                    },
                    top: {
                        top: anchorRect.top - tooltipRect.height - 8,
                        left: anchorRect.left,
                    },
                }

                const isPositionValid = (pos: Position) => {
                    return (
                        pos.top >= 0 &&
                        pos.left >= 0 &&
                        pos.top + tooltipRect.height <= window.innerHeight &&
                        pos.left + tooltipRect.width <= window.innerWidth
                    )
                }

                let finalPosition = positions.right

                if (isPositionValid(positions.right)) {
                    finalPosition = positions.right
                } else if (isPositionValid(positions.left)) {
                    finalPosition = positions.left
                } else if (isPositionValid(positions.bottom)) {
                    finalPosition = positions.bottom
                } else if (isPositionValid(positions.top)) {
                    finalPosition = positions.top
                } else {
                    finalPosition = positions.right

                    if (
                        finalPosition.left + tooltipRect.width >
                        window.innerWidth
                    ) {
                        finalPosition.left =
                            window.innerWidth - tooltipRect.width - 8
                    }
                    if (finalPosition.left < 0) {
                        finalPosition.left = 8
                    }

                    if (
                        finalPosition.top + tooltipRect.height >
                        window.innerHeight
                    ) {
                        finalPosition.top =
                            window.innerHeight - tooltipRect.height - 8
                    }
                    if (finalPosition.top < 0) {
                        finalPosition.top = 8
                    }
                }

                setPosition(finalPosition)
            }
        }, 0)
    }

    const hideTooltip = () => {
        setIsVisible(false)
    }

    return {
        isVisible,
        position,
        anchorRef,
        tooltipRef,
        showTooltip,
        hideTooltip,
    }
}
