import { useEffect } from "preact/hooks";
import { ExtensionOptions } from "../options";

export const OptionsPage = () => {
    useEffect(() => {
        const scrollToHash = () => {
            const rawHash = window.location.hash;
            const hash = rawHash.split("#").pop()?.replace(/^\//, "") ?? "";
            if (!hash) return;
            const element = document.getElementById(hash);
            if (!element) return;
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => window.removeEventListener("hashchange", scrollToHash);
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
                <div className="divider">
                    <h2 id="odoo-options" className="text-xl font-semibold">
                        Odoo
                    </h2>
                </div>
                <div className="columns-1 md:columns-2 gap-4">
                    {ExtensionOptions.filter(
                        (option) => option.category === "Odoo",
                    ).map((option) => (
                        <div
                            key={option.component.name}
                            className="mb-4 break-inside-avoid"
                        >
                            <option.component />
                        </div>
                    ))}
                </div>
            </section>
            <section className="flex flex-col gap-4">
                <div className="divider">
                    <h2 id="odoosh-options" className="text-xl font-semibold">
                        Odoo.SH
                    </h2>
                </div>
                <div className="columns-1 md:columns-2 gap-4">
                    {ExtensionOptions.filter(
                        (option) => option.category === "Odoo.SH",
                    ).map((option) => (
                        <div
                            key={option.component.name}
                            className="mb-4 break-inside-avoid"
                        >
                            <option.component />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
