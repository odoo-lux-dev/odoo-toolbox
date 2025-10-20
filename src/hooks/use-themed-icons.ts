import { useEffect, useState } from "preact/hooks";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";

export const useThemedIcons = () => {
    const [isNostalgia, setIsNostalgia] = useState(false);

    useEffect(() => {
        const loadNostalgiaMode = async () => {
            try {
                const nostalgiaMode = await settingsService.getNostalgiaMode();
                setIsNostalgia(!!nostalgiaMode);
            } catch (error) {
                Logger.error("Error loading nostalgia mode:", error);
            }
        };

        loadNostalgiaMode();
    }, []);

    return {
        isNostalgia,
        themeProps: {
            moonProps: {
                fill: isNostalgia ? "#fdf49a" : "none",
            },
            sunProps: {
                stroke: isNostalgia ? "#FCEA2B" : "currentColor",
            },
        },
    };
};
