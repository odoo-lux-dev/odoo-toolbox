import { useTechnicalSidebar } from "./hooks/use-technical-sidebar";
import { InfoItem } from "./info-item";
import { InfoSection } from "./info-section";
import { ModelActions } from "./model-actions";

export const RecordInfo = () => {
    const { viewInfo } = useTechnicalSidebar();
    const items = [];

    if (viewInfo?.currentModel) {
        items.push(
            <InfoItem
                icon="fa-table"
                label="Model"
                value={viewInfo?.currentModel}
                copyable
            />,
        );
    }

    if (viewInfo?.currentRecordId) {
        items.push(
            <InfoItem
                icon="fa-id-card"
                label="Record ID"
                value={viewInfo?.currentRecordId.toString()}
                copyable
            />,
        );
    }

    if (viewInfo?.viewType) {
        items.push(
            <InfoItem
                icon="fa-eye"
                label="View Type"
                value={viewInfo?.viewType}
                copyable
            />,
        );
    }

    if (viewInfo?.actionType) {
        items.push(
            <InfoItem
                icon="fa-star-o"
                label="Action Type"
                value={viewInfo?.actionType}
                copyable
            />,
        );
    }

    if (viewInfo?.actionName) {
        items.push(
            <InfoItem
                icon="fa-bolt"
                label="Action Name"
                value={viewInfo?.actionName}
                copyable
            />,
        );
    }

    if (viewInfo?.actionXmlId) {
        items.push(
            <InfoItem
                icon="fa-code"
                label="Action XML ID"
                value={viewInfo?.actionXmlId}
                copyable
            />,
        );
    }

    if (viewInfo?.actionContext) {
        items.push(
            <InfoItem
                icon="fa-cog"
                label="Action Context"
                value={viewInfo?.actionContext}
                copyable
            />,
        );
    }

    if (viewInfo?.actionDomain) {
        items.push(
            <InfoItem
                icon="fa-filter"
                label="Action Domain"
                value={viewInfo?.actionDomain}
                copyable
            />,
        );
    }

    return (
        <InfoSection icon="fa-cogs" title="Record Information">
            <>
                {items}
                {viewInfo?.currentModel ? (
                    <ModelActions
                        currentModel={viewInfo?.currentModel}
                        currentRecordId={viewInfo?.currentRecordId}
                    />
                ) : null}
            </>
        </InfoSection>
    );
};
