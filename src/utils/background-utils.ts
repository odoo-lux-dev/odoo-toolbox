import { DebugModeType } from "@/utils/types"
import { generateDebugModeUrl } from "@/features/debug-mode"

const refreshActiveTabs = async (debugMode: DebugModeType) => {
  const currentTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  currentTabs.forEach((tab) => {
    const newUrl = generateDebugModeUrl(new URL(tab.url), debugMode)
    browser.tabs.update(tab.id, {
      url: newUrl,
    })
  })
}

const handleToggleDebugCommand = async () => {
  const { enableDebugMode } = await getSettings()
  if (enableDebugMode === "disabled") {
    await setDebugMode("1")
    await refreshActiveTabs("1")
  } else {
    await setDebugMode("disabled")
    await refreshActiveTabs("disabled")
  }
}

export { refreshActiveTabs, handleToggleDebugCommand }
