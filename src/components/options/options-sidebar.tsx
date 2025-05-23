import {
  handleExportConfig,
  handleImportConfig,
} from "@/entries/options/backup"
import { createRef } from "preact"
import { ChangeEvent } from "preact/compat"
import { useState } from "preact/hooks"
import { OptionsIcon } from "../icons/options-icon"
import { FavoritesIcon } from "../icons/favorites-icon"
import { ExportIcon } from "../icons/export-icon"
import { ImportIcon } from "../icons/import-icon"
import { LuxembourgFlag } from "../icons/luxembourg-flag"
import Match from "preact-router/match"
import { Link } from "preact-router"
import { GithubIcon } from "../icons/github-icon"

export const OptionsSidebar = () => {
  const [statusMessage, setStatusMessage] = useState("")
  const [statusClass, setStatusClass] = useState("")
  const [extensionVersion] = useState(
    `v${browser.runtime.getManifest().version}`
  )

  const fileInputRef = createRef()

  const handleExport = async () => {
    setStatusMessage("Exporting your settings...")
    setStatusClass("x-odoo-backup-options-status-message")
    try {
      await handleExportConfig()
      setStatusMessage("")
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      setStatusMessage(
        `An error occurred during export: ${errorMessage || "Unknown error"}`
      )
      setStatusClass("x-odoo-backup-options-status-message error")
    }
  }

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await handleImportConfig(event)
    ;(event.target as HTMLInputElement).value = ""
  }
  return (
    <div class="sidebar">
      <h1>Odoo Toolbox</h1>
      <div class="x-odoo-options-page-buttons">
        <Match path="/">
          {({ path }: { path: string }) => (
            <Link
              id="global-options"
              className={`x-odoo-options-page-button ${path === "/options" ? "active" : ""}`}
              href="#/options"
            >
              <OptionsIcon />
              Options
            </Link>
          )}
        </Match>
        <Match path="/">
          {({ path }: { path: string }) => (
            <Link
              id="sh-favorites"
              className={`x-odoo-options-page-button ${path === "/favorites" ? "active" : ""}`}
              href="#/favorites"
            >
              <FavoritesIcon />
              SH Favorites
            </Link>
          )}
        </Match>
      </div>
      <div class="x-odoo-options-page-sidebar-footer">
        <div id="x-odoo-backup-options-status" class={statusClass}>
          {statusMessage}
        </div>
        <div class="x-odoo-backup-options-container-buttons">
          <button
            id="x-odoo-backup-options-export-config-btn"
            class="x-odoo-button-with-icon"
            onClick={handleExport}
          >
            <ExportIcon />
            Export
          </button>
          <button
            id="x-odoo-backup-options-import-config-btn"
            class="x-odoo-button-with-icon"
            onClick={handleImport}
          >
            <ImportIcon />
            Restore
          </button>
          <input
            type="file"
            id="x-odoo-backup-options-input-file"
            accept=".json"
            style="display: none;"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <div class="x-odoo-options-page-sidebar-footer-version">
          <a
            href="https://github.com/odoo-lux-dev/odoo-toolbox"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
          >
            <GithubIcon />
          </a>
          <span id="extension-version">{extensionVersion}</span>
          <LuxembourgFlag />
        </div>
      </div>
    </div>
  )
}
