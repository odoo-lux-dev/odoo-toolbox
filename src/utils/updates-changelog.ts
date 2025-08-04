import { UpdateConfig } from "./types"

export const MAJOR_UPDATES: UpdateConfig[] = [
  {
    version: "1.5.0",
    shouldShowUpdatePage: true,
    description:
      "Great news! Odoo Toolbox just got a major upgrade with powerful new developer tools.",
    mainFeature: {
      icon: "🔧",
      title: "New Technical Sidebar",
      description:
        "Inspect fields, view database info, and analyze your Odoo instance like never before!",
    },
    activationMethods: [
      {
        icon: "🔧",
        text: "Via popup toggle (code icon)",
      },
      {
        icon: "⚙️",
        text: "In extension settings",
        action: "openSettings",
      },
      {
        icon: "🚀",
        text: "By clicking here",
        action: "custom",
        customHandler: (
          updateButtonState?: (newState: {
            text: string
            icon: string
            disabled?: boolean
          }) => void
        ) => {
          if (updateButtonState) {
            updateButtonState({
              text: "Enabling...",
              icon: "⏳",
              disabled: true,
            })
            setShowTechnicalList(true).then(() => {
              updateButtonState({
                text: "Enabled !",
                icon: "✅",
                disabled: true,
              })

              setTimeout(() => {
                updateButtonState({
                  text: "By clicking here",
                  icon: "🚀",
                  disabled: false,
                })
              }, 2000)
            })
          }
        },
      },
    ],
    releaseNotes: [
      "🎉 New Technical Sidebar with comprehensive field analysis",
      "📊 Real-time database information display (version, user, company)",
      "🔍 Interactive element selector - click to inspect any field",
      "📋 Copy-to-clipboard functionality for all values",
      "🎯 Field highlighting on hover with detailed properties",
      "🌐 Website context detection for frontend pages",
      "🔧 Enhanced debugging with field states and conditions",
    ],
  },
]
