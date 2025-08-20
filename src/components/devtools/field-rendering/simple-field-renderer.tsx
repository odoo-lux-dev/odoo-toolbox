import type { BaseFieldProps } from "./types"
import { getValueClasses, ValueRenderer } from "./value-renderer"

interface SimpleFieldProps extends BaseFieldProps {
    additionalClasses?: string
}

export const SimpleFieldRenderer = ({
    value,
    additionalClasses = "",
}: SimpleFieldProps) => {
    return (
        <ValueRenderer
            value={value}
            className={`${additionalClasses} ${getValueClasses(value)}`}
        />
    )
}
