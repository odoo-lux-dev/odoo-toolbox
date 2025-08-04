const isDynamicCondition = (
  value: boolean | string | null | undefined
): value is string => {
  return (
    typeof value === "string" &&
    value !== "True" &&
    value !== "False" &&
    value !== "1" &&
    value !== "0"
  )
}

// Utility to check if a debug value is true (True/true/1)
const isDebugTrue = (value: boolean | string | null | undefined): boolean => {
  return value === true || value === "True" || value === "1"
}

// Utility to check if we should use CSS fallback
const shouldUseCSSFallback = (
  debugValue: boolean | string | null | undefined,
  hasDebugInfo: boolean
): boolean => {
  return (
    !hasDebugInfo ||
    debugValue === null ||
    debugValue === undefined ||
    debugValue === false ||
    debugValue === "False" ||
    debugValue === "0"
  )
}

export { isDebugTrue, isDynamicCondition, shouldUseCSSFallback }
