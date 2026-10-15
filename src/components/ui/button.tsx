import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition-transform duration-100 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
  {
    variants: {
      variant: {
        primary: "bg-action text-action-fg",
        secondary: "bg-bg2 text-fg border border-line",
        ghost: "text-fg hover:bg-bg2",
        link: "min-h-0 px-0 text-blue underline-offset-4 hover:underline",
      },
      size: {
        md: "",
        sm: "min-h-9 rounded-lg px-3 text-sm",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
