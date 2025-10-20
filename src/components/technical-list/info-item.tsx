import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface InfoItemProps {
    label: string;
    value: string;
    valueClass?: string;
    icon?: string;
    copyable?: boolean;
}

export const InfoItem = ({
    label,
    value,
    valueClass,
    icon,
    copyable = false,
}: InfoItemProps) => {
    const { copyToClipboard } = useCopyToClipboard();

    const handleCopyValue = async (event: MouseEvent) => {
        if (copyable) {
            const target = event.target as HTMLElement;
            await copyToClipboard(value, target);
        }
    };

    const getValueClasses = () => {
        const baseClass = copyable
            ? "x-odoo-info-value-copyable"
            : "x-odoo-info-value-static";

        return `x-odoo-technical-list-info-value ${baseClass} ${valueClass || ""}`;
    };

    return (
        <div className="x-odoo-technical-list-info-item">
            <div className="x-odoo-technical-list-info-label">
                {icon && <i className={`fa ${icon}`} />}
                <span>{label}</span>
            </div>
            <div
                className={getValueClasses()}
                onClick={copyable ? handleCopyValue : undefined}
                title={copyable ? "Click to copy" : undefined}
            >
                {value}
            </div>
        </div>
    );
};
