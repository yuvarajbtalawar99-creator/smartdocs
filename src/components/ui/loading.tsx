import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const LoadingSpinner = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => {
    return (
        <div
            className={cn(
                "animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12",
                className
            )}
            {...props}
        />
    );
};

export const Loading = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => {
    return (
        <div
            className={cn(
                "flex min-h-[50vh] w-full items-center justify-center",
                className
            )}
            {...props}
        >
            <LoadingSpinner />
        </div>
    );
};
