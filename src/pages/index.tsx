import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import Translate from "@docusaurus/Translate";
import SimpleIcon from "@site/src/components/SimpleIcon";

import styles from "./index.module.css";

type FeatureItem = {
    icon: string;
    title: ReactNode;
    description: ReactNode;
    link: string;
};

const FeatureList: FeatureItem[] = [
    {
        icon: "⚡",
        title: (
            <Translate id="homepage.feature.devtools.title">
                DevTools Panel
            </Translate>
        ),
        description: (
            <Translate id="homepage.feature.devtools.description">
                Query, create, update and delete Odoo records directly from your
                browser DevTools. Advanced RPC testing with domain filters,
                field selection and more.
            </Translate>
        ),
        link: "/docs/odoo/devtools-panel",
    },
    {
        icon: "🔍",
        title: (
            <Translate id="homepage.feature.sidebar.title">
                Technical Sidebar
            </Translate>
        ),
        description: (
            <Translate id="homepage.feature.sidebar.description">
                Inspect fields, types, properties and metadata on any Odoo page.
                Access the technical details of any field in just a few clicks.
            </Translate>
        ),
        link: "/docs/odoo/technical-sidebar",
    },
    {
        icon: "🎯",
        title: (
            <Translate id="homepage.feature.popup.title">
                Extension Popup
            </Translate>
        ),
        description: (
            <Translate id="homepage.feature.popup.description">
                Quick access to the debug mode switch, theme switching and your
                Odoo.SH project favorites. All from a single click on the
                extension icon.
            </Translate>
        ),
        link: "/docs/odoo/popup",
    },
    {
        icon: "🌐",
        title: (
            <Translate id="homepage.feature.odoosh.title">
                Odoo.SH Integration
            </Translate>
        ),
        description: (
            <Translate id="homepage.feature.odoosh.description">
                Manage your Odoo.SH projects with favorites, custom names,
                branch utilities, GitHub links and colorblind-friendly build
                status indicators.
            </Translate>
        ),
        link: "/docs/odoosh/overview",
    },
];

function FeatureCard({ icon, title, description, link }: FeatureItem) {
    return (
        <Link to={link} className={styles.featureCard}>
            <div className={styles.featureIcon}>{icon}</div>
            <div className={styles.featureTitle}>{title}</div>
            <p className={styles.featureDescription}>{description}</p>
        </Link>
    );
}

function HomepageHero() {
    const { siteConfig } = useDocusaurusContext();

    return (
        <header className={styles.heroBanner}>
            <div className={styles.heroContent}>
                <Heading as="h1" className={styles.heroTitle}>
                    {siteConfig.title}
                </Heading>

                <p className={styles.heroSubtitle}>
                    <Translate id="homepage.hero.tagline">
                        Your browser companion for Odoo databases
                    </Translate>
                </p>

                <div className={styles.heroButtons}>
                    <Link
                        className="button button--primary button--lg"
                        to="/docs/intro"
                    >
                        <Translate id="homepage.hero.getStarted">
                            Get Started
                        </Translate>
                    </Link>
                    <Link
                        className="button button--secondary button--lg"
                        href="https://github.com/odoo-lux-dev/odoo-toolbox"
                    >
                        GitHub
                    </Link>
                </div>

                <div className={styles.heroBrowsers}>
                    <span className={styles.browserGroup}>
                        <SimpleIcon
                            slug="googlechrome"
                            size={16}
                            title="Chromium"
                        />
                        <span>Chromium</span>
                        <span className={styles.browserGroupSub}>
                            (Chrome, Brave, Opera…)
                        </span>
                    </span>
                    <span className={styles.browserDivider} />
                    <span className={styles.browserGroup}>
                        <SimpleIcon slug="firefox" size={16} title="Firefox" />
                        <span>Firefox</span>
                    </span>
                </div>
            </div>
        </header>
    );
}

function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div>
                <Heading as="h2" className={styles.sectionTitle}>
                    <Translate id="homepage.features.title">
                        Everything you need
                    </Translate>
                </Heading>
                <p className={styles.sectionSubtitle}>
                    <Translate id="homepage.features.subtitle">
                        The main features, and many more to discover !
                    </Translate>
                </p>
                <div className={styles.featuresGrid}>
                    {FeatureList.map((item, index) => (
                        <FeatureCard key={index} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();

    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <HomepageHero />
            <main>
                <HomepageFeatures />
            </main>
        </Layout>
    );
}
