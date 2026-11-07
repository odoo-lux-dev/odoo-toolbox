/** Message of a thrown value: its own message for an Error, `fallback` otherwise. */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
