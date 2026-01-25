import { HugeiconsIcon } from "@hugeicons/react";
import {
    CodeIcon,
    GlobeIcon,
    HashtagIcon,
    AlignKeyObjectIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { WebsiteInfo as WebsiteInfoType } from "@/types";
import { InfoItem } from "./info-item";

interface WebsiteInfoProps {
    websiteInfo: WebsiteInfoType;
}

export const WebsiteInfo = ({ websiteInfo }: WebsiteInfoProps) => {
    const items = [
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={GlobeIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Website ID"
            value={websiteInfo.websiteId}
            // valueClass="text-primary"
            copyable={true}
        />,
        <InfoItem
            icon={
                <HugeiconsIcon
                    icon={AlignKeyObjectIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            }
            label="Main Object"
            value={websiteInfo.mainObject}
            // valueClass="text-secondary"
            copyable={true}
        />,
    ];

    if (websiteInfo.viewXmlId) {
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
                label="View XML ID"
                value={websiteInfo.viewXmlId}
                // valueClass="text-secondary"
                copyable={true}
            />,
        );
    }

    if (websiteInfo.viewId) {
        items.push(
            <InfoItem
                icon={
                    <HugeiconsIcon
                        icon={HashtagIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
                label="View ID"
                value={websiteInfo.viewId}
                // valueClass="text-secondary"
                copyable={true}
            />,
        );
    }

    return (
        <div className="space-y-4 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-base font-semibold text-base-content">
                    <HugeiconsIcon
                        icon={GlobeIcon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                    <span>Website Information</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge
                        color={websiteInfo.isLogged ? "success" : "warning"}
                        size="sm"
                        variant="outline"
                    >
                        {websiteInfo.isLogged ? "Logged In" : "Public"}
                    </Badge>
                    {websiteInfo.language ? (
                        <Badge color="info" size="sm" variant="outline">
                            {websiteInfo.language}
                        </Badge>
                    ) : null}
                </div>
            </div>

            <div>{items}</div>
        </div>
    );
};
