export interface SelectOption {
  value: string;
  label: string;
  searchableText?: string;
}

/** Exact matches first, then prefix matches (shortest first), then earliest match. */
export const rankOptions = (options: SelectOption[], term: string): SelectOption[] => {
  const score = (option: SelectOption) => {
    const value = option.value.toLowerCase();
    const label = option.label.toLowerCase();
    if (value === term) return [0, 0];
    if (label === term) return [1, 0];
    if (value.startsWith(term)) return [2, value.length];
    if (label.startsWith(term)) return [3, label.length];
    const valueIndex = value.indexOf(term);
    if (valueIndex !== -1) return [4, valueIndex, value.length];
    const labelIndex = label.indexOf(term);
    return [5, labelIndex === -1 ? Infinity : labelIndex, value.length];
  };
  const scored = options.map((option) => ({ option, key: score(option) }));
  scored.sort((a, b) => {
    for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
      const diff = (a.key[i] ?? 0) - (b.key[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
  return scored.map(({ option }) => option);
};
