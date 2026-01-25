import { settingsService } from "@/services/settings-service";
import { UpdateConfig } from "@/types";

export const MAJOR_UPDATES: UpdateConfig[] = [
    {
        version: "1.6.0",
        shouldShowUpdatePage: true,
        description:
            "Incredible update! Odoo Toolbox now includes a complete DevTools panel for advanced database exploration and RPC operations.",
        mainFeature: {
            icon: "wrench-01",
            title: "New DevTools Panel",
            description:
                "Explore your Odoo database like a pro with advanced RPC testing, domain filtering, and real-time data manipulation!",
        },
        activationMethods: [
            {
                icon: "wrench-01",
                text: "Open DevTools (F12) on any Odoo page",
            },
            {
                icon: "chart-bar-line",
                text: "Navigate to 'Odoo Toolbox' tab",
            },
            {
                icon: "rocket-01",
                text: "Start exploring your database!",
            },
        ],
        customSections: [
            {
                title: "Compatibility notice",
                content:
                    "Since Odoo versions earlier than 13 have not been tested, this new feature may not work properly with these versions.",
                type: "warning",
            },
        ],
        releaseNotes: [
            "Complete DevTools panel for Odoo database exploration",
            "Advanced domain editor with Python/JSON syntax support",
            "Real-time query validation and error handling",
            "Quick domain buttons for common filtering patterns",
            "RPC operations: Read, Write, Create, and Call Method tabs",
            "Interactive data manipulation with confirmation modals",
            "Context menus for enhanced field operations",
            "Test your Odoo models directly from the browser",
        ],
    },
    {
        version: "1.5.0",
        shouldShowUpdatePage: true,
        description:
            "Great news! Odoo Toolbox just got a major upgrade with powerful new developer tools.",
        mainFeature: {
            icon: "wrench-01",
            title: "New Technical Sidebar",
            description:
                "Inspect fields, view database info, and analyze your Odoo instance like never before!",
        },
        activationMethods: [
            {
                icon: "wrench-01",
                text: "Via popup toggle (code icon)",
            },
            {
                icon: "settings-02",
                text: "In extension settings",
                action: "openSettings",
            },
            {
                icon: "rocket-01",
                text: "By clicking here",
                action: "custom",
                customHandler: (
                    updateButtonState?: (newState: {
                        text: string;
                        icon: string;
                        disabled?: boolean;
                    }) => void,
                ) => {
                    if (updateButtonState) {
                        updateButtonState({
                            text: "Enabling...",
                            icon: "loading-03",
                            disabled: true,
                        });
                        settingsService.setShowTechnicalList(true).then(() => {
                            updateButtonState({
                                text: "Enabled !",
                                icon: "tick-01",
                                disabled: true,
                            });

                            setTimeout(() => {
                                updateButtonState({
                                    text: "By clicking here",
                                    icon: "rocket-01",
                                    disabled: false,
                                });
                            }, 2000);
                        });
                    }
                },
            },
        ],
        releaseNotes: [
            "New Technical Sidebar with comprehensive field analysis",
            "Real-time database information display (version, user, company)",
            "Interactive element selector - click to inspect any field",
            "Copy-to-clipboard functionality for all values",
            "Field highlighting on hover with detailed properties",
            "Website context detection for frontend pages",
            "Enhanced debugging with field states and conditions",
        ],
    },
];
