import { useState, useEffect } from "preact/hooks"
import {
  CHROME_STORAGE_SETTINGS_TASK_URL,
  CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
  URL_CHECK_REGEX,
} from "@/utils/constants"
import { setGlobalTaskUrl, setTaskRegex } from "@/utils/storage"
import { isValidRegex } from "@/utils/regex"
import { OptionItem } from "@/components/options/option-item"
import { useOptions } from "@/components/options/options-context"

export const TaskLinkOption = () => {
  const [taskUrl, setTaskUrl] = useState("")
  const [regexPattern, setRegexPattern] = useState("")
  const [urlHasError, setUrlHasError] = useState(false)
  const [regexHasError, setRegexHasError] = useState(false)
  const [showUrlSaveButton, setShowUrlSaveButton] = useState(false)
  const [showRegexSaveButton, setShowRegexSaveButton] = useState(false)
  const [initialTaskUrl, setInitialTaskUrl] = useState("")
  const [initialRegexPattern, setInitialRegexPattern] = useState("")
  const { settings } = useOptions()

  useEffect(() => {
    const savedTaskUrl = settings?.[CHROME_STORAGE_SETTINGS_TASK_URL] || ""
    setTaskUrl(savedTaskUrl)
    setInitialTaskUrl(savedTaskUrl)
  }, [settings?.[CHROME_STORAGE_SETTINGS_TASK_URL]])

  useEffect(() => {
    const savedRegexPattern =
      settings?.[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX] || ""
    setRegexPattern(savedRegexPattern)
    setInitialRegexPattern(savedRegexPattern)
  }, [settings?.[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]])

  const handleTaskUrlChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setTaskUrl(value)

    const isValidUrl = URL_CHECK_REGEX.test(value) || value === ""
    const hasChanged = value !== initialTaskUrl

    setUrlHasError(!isValidUrl && value.length > 10)
    setShowUrlSaveButton(hasChanged && isValidUrl)
  }

  const handleRegexChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setRegexPattern(value)

    const isValid = isValidRegex(value)
    const hasChanged = value !== initialRegexPattern

    setRegexHasError(!isValid && value.length > 10)
    setShowRegexSaveButton(hasChanged && isValid)
  }

  const handleUrlSave = async (e: Event) => {
    e.preventDefault()

    if (!URL_CHECK_REGEX.test(taskUrl) && taskUrl !== "") {
      setUrlHasError(true)
      return
    }

    await setGlobalTaskUrl(taskUrl)
    setInitialTaskUrl(taskUrl)
    setShowUrlSaveButton(false)
  }

  const handleRegexSave = async (e: Event) => {
    e.preventDefault()

    if (!isValidRegex(regexPattern)) {
      setRegexHasError(true)
      return
    }

    await setTaskRegex(regexPattern)
    setInitialRegexPattern(regexPattern)
    setShowRegexSaveButton(false)
  }

  const additionalTooltipContent = (
    <ul>
      <li>Leave it empty to disable the feature</li>
      <li>
        Use <i>{"{{task_id}}"}</i> placeholder to replace it with the task ID
      </li>
      <li>
        By default, it's triggered with the following pattern:{" "}
        <i>VERSION-TASKID-OPTIONAL_DESCRIPTION</i>
        <br />
        Examples:
        <ul>
          <li>17.0-12345</li>
          <li>15.0-6789-fixes</li>
        </ul>
      </li>
      <li>
        If you want to use a different nomenclature, you can customize the regex
      </li>
      <li>
        If you want to use a different URL for a favorite project, you can set
        it from the "SH Favorites" page
      </li>
    </ul>
  )

  return (
    <OptionItem
      id="task-link"
      title="Task link on SH branch page"
      tooltipContent="Specify an URL to redirect to when clicking on the task link icon on SH branch page"
      additionalTooltipContent={additionalTooltipContent}
    >
      <div className="x-odoo-options-page-task-link-category">
        <div>
          <div>
            <div className="x-options-form-group">
              <input
                id="task-link-option"
                className={`x-options-input ${urlHasError ? "has-error" : ""}`}
                type="text"
                placeholder="https://www.odoo.com/odoo/project.task/{{task_id}}"
                value={taskUrl}
                onInput={handleTaskUrlChange}
              />
              <label htmlFor="task-link-option">Task link</label>
            </div>
            <button
              id="task-link-option-save-button"
              className="x-odoo-options-page-task-link-save-button"
              style={{ visibility: showUrlSaveButton ? "visible" : "hidden" }}
              onClick={handleUrlSave}
            >
              💾
            </button>
          </div>
          {urlHasError && (
            <span
              className="x-odoo-options-page-task-link-error-message"
              style={{ display: "block" }}
            >
              Link seems incorrect. Please verify.
            </span>
          )}
        </div>

        <div>
          <div>
            <div className="x-options-form-group">
              <input
                id="task-link-option-regex"
                className={`x-options-input ${regexHasError ? "has-error" : ""}`}
                type="text"
                placeholder="/^\d+(?:\.\d+)?-(\d+)(?:-.+)?$/"
                value={regexPattern}
                onInput={handleRegexChange}
              />
              <label htmlFor="task-link-option-regex">Branch name regex</label>
            </div>
            <button
              id="task-link-option-save-button-regex"
              className="x-odoo-options-page-task-link-save-button"
              style={{ visibility: showRegexSaveButton ? "visible" : "hidden" }}
              onClick={handleRegexSave}
            >
              💾
            </button>
          </div>
          {regexHasError && (
            <span
              className="x-odoo-options-page-task-link-regex-error-message"
              style={{ display: "block" }}
            >
              Regex seems incorrect. Please verify.
            </span>
          )}
        </div>
      </div>
    </OptionItem>
  )
}
