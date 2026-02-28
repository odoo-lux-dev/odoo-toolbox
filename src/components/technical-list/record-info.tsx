import { HugeiconsIcon } from "@hugeicons/react";
import {
    CodeIcon,
    StarsIcon,
    DatabaseIcon,
    EyeIcon,
    FilterIcon,
    IdIcon,
    Settings02Icon,
    StarIcon,
    ThreeDViewIcon,
    IdentificationIcon,
} from "@hugeicons/core-free-icons";
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
                icon={
                    <HugeiconsIcon
                        icon={DatabaseIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Model"
                value={viewInfo.currentModel}
                copyable
            />,
        );
    }

    if (viewInfo?.currentRecordId) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={IdIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Record ID"
                value={viewInfo.currentRecordId.toString()}
                copyable
            />,
        );
    }

    if (viewInfo?.viewType) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={EyeIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="View Type"
                value={viewInfo.viewType}
                copyable
            />,
        );
    }

    if (viewInfo?.actionType) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={StarIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Action Type"
                value={viewInfo.actionType}
                copyable
            />,
        );
    }

    if (viewInfo?.actionName) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={StarsIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Action Name"
                value={viewInfo.actionName}
                copyable
            />,
        );
    }

    if (viewInfo?.actionId) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={IdentificationIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Action ID"
                value={viewInfo.actionId.toString()}
                copyable
            />,
        );
    }

    if (viewInfo?.actionXmlId) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={CodeIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Action XML ID"
                value={viewInfo.actionXmlId}
                copyable
            />,
        );
    }

    if (viewInfo?.actionContext) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={Settings02Icon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Action Context"
                value={viewInfo.actionContext}
                copyable
            />,
        );
    }

    if (viewInfo?.actionDomain) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={FilterIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="Action Domain"
                value={viewInfo.actionDomain}
                copyable
            />,
        );
    }

    return (
        <InfoSection
            icon={
                <HugeiconsIcon
                    icon={ThreeDViewIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            title="Record Information"
        >
            <>
                {items}
                {viewInfo?.currentModel ? (
                    <ModelActions
                        currentModel={viewInfo.currentModel}
                        currentRecordId={viewInfo.currentRecordId}
                    />
                ) : null}
            </>
        </InfoSection>
    );
};
