import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarRight01Icon } from "@hugeicons/core-free-icons";

export const TechnicalSidebarIcon = ({
    isEnabled = true,
    isNostalgia = false,
    size = 18,
}: {
    isEnabled?: boolean;
    isNostalgia?: boolean;
    size?: number;
}) => {
    const diagonalColor = isNostalgia ? "var(--color-error)" : "currentColor";

    return (
        <span className={`swap ${isEnabled ? "swap-active" : ""} swap-rotate`}>
            <span className="swap-on">
                <HugeiconsIcon
                    icon={SidebarRight01Icon}
                    size={size}
                    color={isNostalgia ? "var(--color-accent)" : "currentColor"}
                    strokeWidth={2}
                />
            </span>
            <span className="swap-off">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.2"
                    viewBox="0 0 24 24"
                    width={size}
                    height={size}
                >
                    <defs>
                        <mask id="mask-diagonal">
                            <rect width="24" height="24" fill="white" />
                            <path
                                d="m2.1 1.9l20 20"
                                fill="none"
                                stroke="black"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                        </mask>
                    </defs>
                    <style>{`.a{fill:none;stroke:currentColor;stroke-width:${2};stroke-linecap:round}.b{fill:none;stroke:${diagonalColor};stroke-linecap:round;stroke-linejoin:round;stroke-width:${2}}`}</style>

                    <path
                        mask="url(#mask-diagonal)"
                        className="a"
                        d="m2 12c0-3.7 0-5.5 0.8-6.8q0.5-0.8 1.1-1.3c1.2-0.9 2.8-0.9 6.1-0.9h4c3.3 0 4.9 0 6.1 0.9q0.6 0.5 1.1 1.3c0.8 1.3 0.8 3.1 0.8 6.8 0 3.7 0 5.5-0.8 6.8q-0.5 0.8-1.1 1.3c-1.2 0.9-2.8 0.9-6.1 0.9h-4c-3.3 0-4.9 0-6.1-0.9q-0.6-0.5-1.1-1.3c-0.8-1.3-0.8-3.1-0.8-6.8z"
                    />
                    <path className="a" d="m14.5 3v18" />
                    <path className="a" d="m18 7h1m-1 3h1" />
                    <path className="b" d="m2.1 1.9l20 20" />
                </svg>
            </span>
        </span>
    );
};
