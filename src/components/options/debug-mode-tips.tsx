import { Info } from "lucide-preact";
import { ComponentChildren } from "preact";

export const DebugModeTips = ({
    children,
}: {
    children: ComponentChildren;
}) => {
    return (
        <div className="debug-mode-tips">
            <Info />
            {children}
        </div>
    );
};
