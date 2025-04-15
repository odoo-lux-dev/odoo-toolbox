import "./style.scss"
import { useEffect } from "preact/hooks"
import { usePopup } from "@/components/popup/popup-context"
import { Header } from "@/components/popup/header"
import { ProjectList } from "@/components/popup/project-list"
import { Footer } from "@/components/popup/footer"

export const App = () => {
  const { theme } = usePopup()

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
