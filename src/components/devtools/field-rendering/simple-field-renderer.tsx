import type { BaseFieldProps } from "./types"
import { getValueClasses, ValueRenderer } from "./value-renderer"

interface SimpleFieldProps extends BaseFieldProps {
    additionalClasses?: string
    level?: number
}

export const SimpleFieldRenderer = ({
    value,
    fieldName,
    additionalClasses = "",
    level = 0,
}: SimpleFieldProps) => {
    return (
        <ValueRenderer
            value={value}
            level={level}
            fieldName={fieldName}
            className={`${additionalClasses} ${getValueClasses(value)}`}
        />
    )
}
