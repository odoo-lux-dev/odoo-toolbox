const debounce = <A extends unknown[]>(fn: (...args: A) => void, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

interface ProjectSearch {
  items: () => HTMLElement[];
  /** Names an item matches on: its Odoo name and its favorite display name. */
  names: (item: HTMLElement) => (string | null | undefined)[];
  setVisible: (item: HTMLElement, visible: boolean) => void;
  open: (item: HTMLElement) => void;
  delay: number;
}

/** Filters the projects as the user types in `input`; Enter opens the only match. */
export const bindProjectSearch = (input: HTMLInputElement, search: ProjectSearch): (() => void) => {
  const matches = (item: HTMLElement) => {
    const query = input.value.trim().toLowerCase();
    return !query || search.names(item).some((name) => name?.toLowerCase().includes(query));
  };
  const apply = () => {
    for (const item of search.items()) search.setVisible(item, matches(item));
  };
  const applyDebounced = debounce(apply, search.delay);

  input.addEventListener("input", applyDebounced);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    applyDebounced.cancel();
    apply();
    const visible = search.items().filter(matches);
    if (visible.length !== 1) return;
    event.preventDefault();
    search.open(visible[0]);
  });
  return applyDebounced.cancel;
};
