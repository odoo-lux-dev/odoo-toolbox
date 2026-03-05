import clsx from "clsx";
import styles from "./styles.module.css";

interface SimpleIconProps {
    slug: string;
    size?: number;
    className?: string;
    title?: string;
}

export default function SimpleIcon({
    slug,
    size = 20,
    className,
    title,
}: SimpleIconProps) {
    return (
        <img
            src={`https://cdn.simpleicons.org/${slug}`}
            alt={title ?? slug}
            title={title}
            width={size}
            height={size}
            className={clsx(styles.icon, className)}
        />
    );
}
