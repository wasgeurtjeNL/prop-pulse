'use client'

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Better Auth handles sessions automatically via cookies
  // No wrapper needed, but keeping this component for future enhancements
  return <>{children}</>
}

