import { WebsiteInfo as WebsiteInfoType } from "@/types";
import { InfoItem } from "./info-item";

interface WebsiteInfoProps {
    websiteInfo: WebsiteInfoType;
}

export const WebsiteInfo = ({ websiteInfo }: WebsiteInfoProps) => {
    const items = [
        <InfoItem
            icon="fa-globe"
            label="Website ID"
            value={websiteInfo.websiteId}
            valueClass="code"
            copyable={true}
        />,
        <InfoItem
            icon="fa-object-group"
            label="Main Object"
            value={websiteInfo.mainObject}
            valueClass="code"
            copyable={true}
        />,
    ];

    if (websiteInfo.viewXmlId) {
        items.push(
            <InfoItem
                icon="fa-code"
                label="View XML ID"
                value={websiteInfo.viewXmlId}
                valueClass="code"
                copyable={true}
            />,
        );
    }

    if (websiteInfo.viewId) {
        items.push(
            <InfoItem
                icon="fa-hashtag"
                label="View ID"
                value={websiteInfo.viewId}
                valueClass="code"
                copyable={true}
            />,
        );
    }

    return (
        <div className="x-odoo-website-info">
            <div className="x-odoo-website-info-header">
                <div className="x-odoo-website-info-title">
                    <i className="fa fa-globe" />
                    <span>Website Information</span>
                </div>
                <div className="x-odoo-website-info-status">
                    <span
                        className={`x-odoo-website-status ${websiteInfo.isLogged ? "logged-in" : "logged-out"}`}
                    >
                        {websiteInfo.isLogged ? "🔐 Logged In" : "🔓 Public"}
                    </span>
                    {websiteInfo.language && (
                        <span className="x-odoo-website-language">
                            🌐 {websiteInfo.language}
                        </span>
                    )}
                </div>
            </div>

            <div className="x-odoo-website-info-content">{items}</div>
        </div>
    );
};
