import "./style.scss"
import { useEffect } from "preact/hooks"
import { Footer } from "@/components/popup/footer"
import { Header } from "@/components/popup/header"
import { ProjectList } from "@/components/popup/project-list"
import { usePopup } from "@/contexts/popup-signals-hook"

export const App = () => {
    const { theme, initializeData } = usePopup()

    useEffect(() => {
        initializeData()
    }, [])

    useEffect(() => {
        document.body.className = theme
    }, [theme])

    return (
        <>
            <Header />
            <main className="container">
                <ProjectList />
            </main>
            <Footer />
        </>
    )
}
