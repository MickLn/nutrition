import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-base px-4 font-medium transition-transform duration-100 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-actif",
  {
    variants: {
      variant: {
        primary: "min-h-[52px] w-full bg-signal text-corps text-sur-signal",
        secondary: "min-h-[52px] border-[1.5px] border-texte text-corps font-normal text-texte",
        ghost: "text-texte hover:bg-piste",
        link: "min-h-8 text-corps font-normal text-actif underline",
      },
      size: {
        md: "",
        sm: "min-h-9 rounded-base px-3 text-sm",
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
