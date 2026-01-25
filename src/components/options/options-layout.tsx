import { ComponentChildren } from "preact";
import { OptionsSidebar } from "./options-sidebar";

export const OptionsLayout = ({
    children,
}: {
    children: ComponentChildren;
}) => {
    return (
        <div class="h-screen overflow-hidden bg-base-300 text-base-content">
            <div class="flex h-full">
                <OptionsSidebar />
                <main
                    id="content-container"
                    class="flex-1 h-full overflow-y-auto px-6 py-8"
                >
                    {children}
                </main>
            </div>
        </div>
    );
};
