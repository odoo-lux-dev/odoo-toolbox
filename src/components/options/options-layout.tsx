import { ComponentChildren, Fragment } from "preact"
import { OptionsSidebar } from "./options-sidebar"

export const OptionsLayout = ({
  children,
}: { children: ComponentChildren }) => {
  return (
    <Fragment>
      <OptionsSidebar />
      <div id="content-container" class="content">
        {children}
      </div>
    </Fragment>
  )
}
