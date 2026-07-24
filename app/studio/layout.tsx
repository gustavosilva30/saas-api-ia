import { QuickSearch } from "@/components/studio/layout/QuickSearch"

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {children}
      <QuickSearch />
    </div>
  )
}
