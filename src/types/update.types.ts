export type AlarmOption = {
    when: number;
    periodInMinutes: number;
    delayInMinutes: number;
};

export interface ActivationMethod {
    icon: string;
    text: string;
    action?: "openSettings" | "openUrl" | "custom";
    url?: string;
    customHandler?: (
        updateButtonState?: (newState: {
            text: string;
            icon: string;
            disabled?: boolean;
        }) => void,
    ) => void;
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
