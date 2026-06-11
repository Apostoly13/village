import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
"flex h-[42px] w-full rounded-[8px] border border-border bg-transparent px-3 py-1 text-base transition-[border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--clay)] focus:shadow-[0_0_0_3px_rgba(196,112,90,0.20)] focus-visible:outline-none focus-visible:border-[var(--clay)] focus-visible:shadow-[0_0_0_3px_rgba(196,112,90,0.20)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
