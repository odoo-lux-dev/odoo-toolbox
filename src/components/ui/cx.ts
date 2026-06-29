export const cx = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");
