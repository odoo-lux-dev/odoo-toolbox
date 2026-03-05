import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: "Odoo Toolbox",
    tagline: "Your browser companion for Odoo databases",
    favicon: "img/logo.png",

    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: {
        v4: true, // Improve compatibility with the upcoming Docusaurus v4
    },

    // Set the production url of your site here
    url: "https://odoo-lux-dev.github.io",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/odoo-toolbox/",
    organizationName: "odoo-lux-dev",
    projectName: "odoo-toolbox",
    trailingSlash: false,

    onBrokenLinks: "throw",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en", "fr"],
        localeConfigs: {
            en: {
                label: "English",
                direction: "ltr",
                htmlLang: "en",
            },
            fr: {
                label: "Français",
                direction: "ltr",
                htmlLang: "fr",
            },
        },
    },

    plugins: ["docusaurus-plugin-image-zoom"],

    themes: [
        [
            require.resolve("@easyops-cn/docusaurus-search-local"),
            {
                hashed: true,
                language: ["en", "fr"],
                highlightSearchTermsOnTargetPage: true,
                explicitSearchResultPath: true,
                indexBlog: false,
            },
        ],
    ],

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    editUrl:
                        "https://github.com/odoo-lux-dev/odoo-toolbox/edit/docs/",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
                blog: false,
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
        image: "img/social-card.png",
        zoom: {
            selector: ".markdown img",
            background: {
                light: "rgba(255, 255, 255, 0.9)",
                dark: "rgba(30, 30, 30, 0.9)",
            },
            config: {
                margin: 24,
                scrollOffset: 0,
            },
        },
        colorMode: {
            respectPrefersColorScheme: true,
        },
        navbar: {
            title: "Odoo Toolbox",
            logo: {
                alt: "Odoo Toolbox Logo",
                src: "img/logo.png",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "tutorialSidebar",
                    position: "left",
                    label: "Documentation",
                },
                {
                    type: "localeDropdown",
                    position: "right",
                },
                {
                    href: "https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd",
                    position: "right",
                    className: "header-icon-link header-chrome-link",
                    "aria-label": "Chrome Web Store",
                    label: "Chrome Web Store",
                },
                {
                    href: "https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/",
                    position: "right",
                    className: "header-icon-link header-firefox-link",
                    "aria-label": "Firefox Add-ons",
                    label: "Firefox Add-ons",
                },
                {
                    href: "https://github.com/odoo-lux-dev/odoo-toolbox",
                    position: "right",
                    className: "header-icon-link header-github-link",
                    "aria-label": "GitHub",
                    label: "GitHub",
                },
            ],
        },
        footer: {
            style: "light",
            links: [
                {
                    title: "Documentation",
                    items: [
                        {
                            label: "Getting Started",
                            to: "/docs/intro",
                        },
                        {
                            label: "DevTools Panel",
                            to: "/docs/odoo/devtools-panel",
                        },
                        {
                            label: "Technical Sidebar",
                            to: "/docs/odoo/technical-sidebar",
                        },
                        {
                            label: "Odoo.SH Integration",
                            to: "/docs/odoosh/overview",
                        },
                        {
                            label: "Options",
                            to: "/docs/options",
                        },
                    ],
                },
                {
                    title: "Install",
                    items: [
                        {
                            label: "Chrome Web Store",
                            href: "https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd",
                        },
                        {
                            label: "Firefox Add-ons",
                            href: "https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/",
                        },
                    ],
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "GitHub",
                            href: "https://github.com/odoo-lux-dev/odoo-toolbox",
                        },
                        {
                            label: "Report an Issue",
                            href: "https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=bug_report.yml",
                        },
                        {
                            label: "Suggest a Feature",
                            href: "https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=feature_request.yml",
                        },
                    ],
                },
            ],
            copyright: "Built with Docusaurus",
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
