import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface FieldFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showOnlyRequired: boolean;
    onRequiredChange: (show: boolean) => void;
    showOnlyReadonly: boolean;
    onReadonlyChange: (show: boolean) => void;
    showOnlyFields: boolean;
    onFieldsChange: (show: boolean) => void;
    showOnlyButtons: boolean;
    onButtonsChange: (show: boolean) => void;
}

export const FieldFilters = ({
    searchTerm,
    onSearchChange,
    showOnlyRequired,
    onRequiredChange,
    showOnlyReadonly,
    onReadonlyChange,
    showOnlyFields,
    onFieldsChange,
    showOnlyButtons,
    onButtonsChange,
}: FieldFiltersProps) => (
    <div className="border-b border-solid border-base-200 px-6 py-4">
        <div>
            <Input
                type="text"
                size="sm"
                placeholder="Search fields and buttons..."
                value={searchTerm}
                onInput={(event) =>
                    onSearchChange((event.target as HTMLInputElement).value)
                }
                fullWidth
                className="input-bordered text-xs"
                suffix={
                    <HugeiconsIcon
                        icon={Search01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                        className="text-base-content/50"
                    />
                }
            />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-base-content/80 sm:grid-cols-2">
            <div className="space-y-2">
                <div>
                    <Checkbox
                        checked={showOnlyRequired}
                        onCheckedChange={onRequiredChange}
                        label="Required only"
                        size="xs"
                    />
                </div>
                <div>
                    <Checkbox
                        checked={showOnlyReadonly}
                        onCheckedChange={onReadonlyChange}
                        label="Readonly only"
                        size="xs"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <div>
                    <Checkbox
                        checked={showOnlyFields}
                        onCheckedChange={onFieldsChange}
                        label="Fields only"
                        size="xs"
                    />
                </div>
                <div>
                    <Checkbox
                        checked={showOnlyButtons}
                        onCheckedChange={onButtonsChange}
                        label="Buttons only"
                        size="xs"
                    />
                </div>
            </div>
        </div>
    </div>
);
