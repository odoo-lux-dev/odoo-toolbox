import { JSX } from "preact";
import { route } from "preact-router";
import { Tab, Tabs } from "@/components/ui/tabs";

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
        <div className="devtools-app h-screen min-h-0 overflow-hidden bg-base-300 text-base-content flex flex-col">
            <nav className="devtools-nav bg-base-300">
                <Tabs variant="bordered" className="px-6">
                    {navItems.map((item) => (
                        <Tab
                            key={item.id}
                            active={currentPath === item.path}
                            onClick={() => handleNavigation(item.path)}
                        >
                            {item.label}
                        </Tab>
                    ))}
                </Tabs>
            </nav>

            <main className="devtools-content bg-base-100 flex-1 min-h-0 flex flex-col">
                {children}
            </main>
        </div>
    );
};
