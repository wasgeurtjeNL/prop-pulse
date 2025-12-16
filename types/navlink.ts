export type NavSubLink = {
  label: string
  href: string
  description?: string
  icon?: string
}

export type NavLinks = {
  label: string
  href: string
  highlight?: boolean
  icon?: string
  children?: NavSubLink[]
}
