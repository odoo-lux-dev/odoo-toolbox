import "./style.css";
import { useEffect } from "preact/hooks";
import { Footer } from "@/components/popup/footer";
import { Header } from "@/components/popup/header";
import { ProjectList } from "@/components/popup/project-list";
import { usePopup } from "@/contexts/popup-signals-hook";

export const App = () => {
    const { theme, initializeData } = usePopup();

    useEffect(() => {
        initializeData();
    }, []);

    useEffect(() => {
        const themeName = theme === "dark" ? "odoodark" : "odoolight";
        document.documentElement.setAttribute("data-theme", themeName);
    }, [theme]);

    return (
        <div className="flex max-h-150 w-70 flex-col bg-base-100 text-base-content">
            <Header />
            <main className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
                <ProjectList />
            </main>
            <Footer />
        </div>
    );
};
