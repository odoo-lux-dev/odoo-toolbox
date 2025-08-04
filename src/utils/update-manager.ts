import { MAJOR_UPDATES } from "./updates-changelog"

/**
 * Compares two semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split(".").map(Number)
  const parts2 = v2.split(".").map(Number)

  const maxLength = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 < part2) return -1
    if (part1 > part2) return 1
  }

  return 0
}

/**
 * Finds the most recent update page to show based on version range
 * Checks all versions between previousVersion and currentVersion
 */
export const shouldShowUpdatePage = (
  currentVersion: string,
  previousVersion: string
): boolean => {
  // Find all major updates that should be shown and fall within the version range
  const relevantUpdates = MAJOR_UPDATES.filter((update) => {
    const isAfterPrevious = compareVersions(update.version, previousVersion) > 0
    const isBeforeOrEqualCurrent =
      compareVersions(update.version, currentVersion) <= 0
    return (
      update.shouldShowUpdatePage && isAfterPrevious && isBeforeOrEqualCurrent
    )
  })

  return relevantUpdates.length > 0
}

/**
 * Gets complete update information for display
 */
export const getUpdateInfo = (
  currentVersion: string
): {
  notes: string[]
  updateVersion?: string
  title?: string
  description?: string
  mainFeature?: UpdateConfig["mainFeature"]
  activationMethods?: UpdateConfig["activationMethods"]
  customSections?: UpdateConfig["customSections"]
} => {
  // Find all versions with update pages that are ≤ current version
  const eligibleUpdates = MAJOR_UPDATES.filter((update) => {
    return (
      update.shouldShowUpdatePage &&
      compareVersions(update.version, currentVersion) <= 0
    )
  })

  if (eligibleUpdates.length === 0) {
    return { notes: [] }
  }

  // Sort by version and get the most recent one
  eligibleUpdates.sort((a, b) => compareVersions(b.version, a.version))
  const mostRecentUpdate = eligibleUpdates[0]

  return {
    notes: mostRecentUpdate.releaseNotes || [],
    updateVersion: mostRecentUpdate.version,
    title: mostRecentUpdate.title,
    description: mostRecentUpdate.description,
    mainFeature: mostRecentUpdate.mainFeature,
    activationMethods: mostRecentUpdate.activationMethods,
    customSections: mostRecentUpdate.customSections,
  }
}
