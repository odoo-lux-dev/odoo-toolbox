import { configurationService } from "@/services/configuration-service"
import { Logger } from "@/services/logger"

export async function handleExportConfig() {
    try {
        const configStatus = document.getElementById(
            "x-odoo-backup-options-status"
        )!
        configStatus.textContent = "Exporting your settings..."
        configStatus.className = "x-odoo-backup-options-status-message"

        const config = await configurationService.exportConfiguration()

        const blob = new Blob([JSON.stringify(config, null, 2)], {
            type: "application/json",
        })
        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        const date = new Date().toISOString().split("T")[0]
        a.download = `sh-extension-config-${date}.json`
        a.click()

        URL.revokeObjectURL(url)

        configStatus.textContent = ""
    } catch (error) {
        Logger.error("An error occured during the export:", error)

        const configStatus = document.getElementById(
            "x-odoo-backup-options-status"
        )!
        configStatus.textContent = `An error occured during the export: ${error instanceof Error ? error.message : "Unknown error"}`
        configStatus.className = "x-odoo-backup-options-status-message error"
    }
}

export async function handleImportConfig(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const configStatus = document.getElementById(
        "x-odoo-backup-options-status"
    )!
    configStatus.textContent = "Importing your settings..."
    configStatus.className = "x-odoo-backup-options-status-message"

    try {
        const reader = new FileReader()

        reader.onload = async (e) => {
            try {
                const content = e.target?.result
                if (typeof content !== "string") {
                    throw new Error("Failed to read file content")
                }
                const config = JSON.parse(content)

                const validationResult = validateConfigFile(config)

                if (!validationResult.valid) {
                    throw new Error(
                        `Invalid configuration file - ${validationResult.message}`
                    )
                }

                await configurationService.importConfiguration(config)

                configStatus.textContent = "Configuration successfully imported"
                configStatus.className =
                    "x-odoo-backup-options-status-message success"

                setTimeout(() => {
                    configStatus.className =
                        "x-odoo-backup-options-status-message"
                }, 3000)
            } catch (parseError) {
                Logger.error(
                    "An error occured during file process:",
                    parseError
                )
                configStatus.textContent = `An error occured during file process: ${parseError instanceof Error ? parseError.message : "Invalid file format"}`
                configStatus.className =
                    "x-odoo-backup-options-status-message error"
            }
        }

        reader.readAsText(file)
    } catch (error) {
        Logger.error("An error occured during the import:", error)
        configStatus.textContent = `An error occured during the import: ${error instanceof Error ? error.message : "Unknown error"}`
        configStatus.className = "x-odoo-backup-options-status-message error"
    }

    if (event.target) {
        ;(event.target as HTMLInputElement).value = ""
    }
}
