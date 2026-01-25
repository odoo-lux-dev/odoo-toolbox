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
        <div className="flex min-h-screen flex-col bg-base-100 text-base-content w-[280px]">
            <Header />
            <main className="flex-1 px-2 py-4">
                <ProjectList />
            </main>
            <Footer />
        </div>
    );
};
