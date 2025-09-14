import { InfoItem } from "./info-item"
import { InfoSection } from "./info-section"
import { ModelActions } from "./model-actions"

interface RecordInfoProps {
    currentModel?: string
    currentRecordId?: number
    viewType?: string
}

export const RecordInfo = ({
    currentModel,
    currentRecordId,
    viewType,
}: RecordInfoProps) => {
    const items = []

    if (currentModel) {
        items.push(
            <InfoItem
                icon="fa-table"
                label="Model"
                value={currentModel}
                copyable={true}
            />
        )
    }

    if (currentRecordId) {
        items.push(
            <InfoItem
                icon="fa-id-card"
                label="Record ID"
                value={currentRecordId.toString()}
                copyable={true}
            />
        )
    }

    if (viewType) {
        items.push(
            <InfoItem
                icon="fa-eye"
                label="View Type"
                value={viewType}
                copyable={true}
            />
        )
    }

    return (
        <InfoSection icon="fa-cogs" title="Record Information">
            <>
                {items}
                {currentModel ? <ModelActions currentModel={currentModel} /> : null}
            </>
        </InfoSection>
    )
}
