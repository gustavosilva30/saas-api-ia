import { Eraser } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  showText = true,
  size = "default",
}: {
  className?: string
  showText?: boolean
  size?: "sm" | "default" | "lg"
}) {
  const box = size === "sm" ? "size-7" : size === "lg" ? "size-10" : "size-8"
  const text = size === "lg" ? "text-xl" : "text-base"
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          box,
        )}
        aria-hidden="true"
      >
        <Eraser className="size-1/2" />
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight", text)}>
          Claro
        </span>
      )}
    </div>
  )
}
