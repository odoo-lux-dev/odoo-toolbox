export const Header = () => (
    <header className="border-b-2 border-base-200 bg-primary p-4 dark:bg-base-100">
        <h2 className="text-center text-xl font-semibold text-gray-100 dark:text-base-content">
            Your{" "}
            <a
                href="https://www.odoo.sh/project"
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent dark:text-primary"
            >
                Odoo.SH
            </a>{" "}
            projects
        </h2>
    </header>
);
