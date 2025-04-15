import { InformationIcon } from "@/components/icons/information-icon"
import { ComponentChildren } from "preact"

export const DebugModeTips = ({
  children,
}: { children: ComponentChildren }) => {
  return (
    <div className="debug-mode-tips">
      <InformationIcon />
      {children}
    </div>
  )
}
