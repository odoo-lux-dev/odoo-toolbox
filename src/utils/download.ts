/** Saves `content` as a JSON file named `fileName` (browser download). */
export const downloadJson = (fileName: string, content: unknown) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
