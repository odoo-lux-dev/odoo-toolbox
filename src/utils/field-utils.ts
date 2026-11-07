const isDynamicCondition = (value: boolean | string | null | undefined): value is string => {
  return (
    typeof value === "string" &&
    value !== "True" &&
    value !== "False" &&
    value !== "1" &&
    value !== "0"
  );
};

const isDebugTrue = (value: boolean | string | null | undefined): boolean => {
  return value === true || value === "True" || value === "1";
};

export { isDebugTrue, isDynamicCondition };
