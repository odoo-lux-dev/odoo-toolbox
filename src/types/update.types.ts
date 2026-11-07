/** Text, icon name and state of an activation button. */
export interface ActivationButtonState {
  text: string;
  icon: string;
  disabled?: boolean;
}

export interface ActivationMethod {
  icon: string;
  text: string;
  action?: "openSettings" | "openUrl" | "custom";
  url?: string;
  customHandler?: (updateButtonState: (state: ActivationButtonState) => void) => Promise<void>;
}

export interface UpdateConfig {
  version: string;
  shouldShowUpdatePage: boolean;
  releaseNotes?: string[];
  title?: string;
  description?: string;
  mainFeature?: {
    icon: string;
    title: string;
    description: string;
  };
  activationMethods?: Array<ActivationMethod>;
  customSections?: Array<{
    title: string;
    content: string;
    type: "info" | "warning" | "success";
  }>;
}
