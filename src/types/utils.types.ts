export interface DomainValidationResult {
  isValid: boolean;
  error?: string;
}

export interface NotificationFunction {
  (message: string, type: "success" | "warning" | "error" | "info"): void;
}
