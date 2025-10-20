import { JSX } from "preact";
import { route } from "preact-router";

interface DevToolsLayoutProps {
    children: JSX.Element;
    currentPath: string;
}

interface NavItem {
    id: string;
    label: string;
    path: string;
}

const navItems: NavItem[] = [
    { id: "search", label: "Search", path: "/search" },
    { id: "write", label: "Write", path: "/write" },
    { id: "create", label: "Create", path: "/create" },
    { id: "call-method", label: "Call Method", path: "/call-method" },
    { id: "unlink", label: "Unlink", path: "/unlink" },
    { id: "history", label: "History", path: "/history" },
];

export const DevToolsLayout = ({
    children,
    currentPath,
}: DevToolsLayoutProps) => {
    const handleNavigation = (path: string) => {
        route(path);
    };

    return (
        <div className="devtools-app">
            <nav className="devtools-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-tab ${currentPath === item.path ? "active" : ""}`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <main className="devtools-content">{children}</main>
        </div>
    );
};
