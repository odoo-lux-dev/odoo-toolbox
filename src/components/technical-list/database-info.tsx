import { HugeiconsIcon } from "@hugeicons/react";
import {
    Bug01Icon,
    Tag01Icon,
    DatabaseIcon,
    GlobeIcon,
    Settings02Icon,
} from "@hugeicons/core-free-icons";
import { DatabaseInfo } from "@/types";
import { InfoItem } from "./info-item";
import { InfoSection } from "./info-section";

interface DatabaseInfoComponentProps {
    dbInfo: DatabaseInfo;
}

export const DatabaseInfoComponent = ({
    dbInfo,
}: DatabaseInfoComponentProps) => {
    const items = [
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={Tag01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Version"
            value={dbInfo.version}
            copyable={true}
        />,
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={DatabaseIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Database"
            value={dbInfo.database}
            copyable={true}
        />,
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={Settings02Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Server Info"
            value={dbInfo.serverInfo}
            copyable={true}
        />,
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={GlobeIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Language"
            value={dbInfo.language}
            copyable={true}
        />,
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={Bug01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Debug Mode"
            value={dbInfo.debugMode}
            valueClass={`${dbInfo.debugMode === "Disabled" ? "text-error" : "text-success"} font-semibold`}
            copyable={false}
        />,
    ];

    return (
        <InfoSection
            icon={
                <HugeiconsIcon
                    icon={DatabaseIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            title="Database Information"
        >
            {items}
        </InfoSection>
    );
};
