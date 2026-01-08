'use client'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import NavLink from './navigation/NavLink'
import { authClient } from '@/lib/auth-client'
import LanguageToggle from '../language-toggle'
import { cn } from '@/lib/utils'
import { useLayoutData } from '@/lib/contexts/layout-data-context'
import { useFavorites } from '@/lib/contexts/FavoritesContext'
// Static icons for critical path - no API calls needed
import {
  EnvelopeIcon,
  PhoneIcon,
  PhoneBoldIcon,
  CaretDownBoldIcon,
  ArrowRightBoldIcon,
  TagBoldIcon,
  ListIcon,
  XIcon,
  MapPinIcon,
  FacebookFillIcon,
  InstagramLineIcon,
  LinkedinFillIcon,
  YoutubeFillIcon,
  LineFillIcon,
  WhatsappFillIcon,
  SunBoldIcon,
  MoonBoldIcon,
  CalculatorBoldIcon,
  HeartFillIcon,
  StaticIcon,
} from '@/components/icons/StaticIcons'

// Social media links with static SVG components (no Iconify API calls)
const socialLinks = [
  { Icon: FacebookFillIcon, href: 'https://facebook.com/psmphuket', label: 'Facebook' },
  { Icon: InstagramLineIcon, href: 'https://instagram.com/psmphuket', label: 'Instagram' },
  { Icon: LinkedinFillIcon, href: 'https://linkedin.com/company/psmphuket', label: 'LinkedIn' },
  { Icon: YoutubeFillIcon, href: 'https://youtube.com/@psmphuket', label: 'YouTube' },
  { Icon: LineFillIcon, href: 'https://line.me/ti/p/psmphuket', label: 'Line' },
]

const Header: React.FC = () => {
  const { data: session } = authClient.useSession();
  const { data: layoutData } = useLayoutData();
  const { favoritesCount } = useFavorites();
  const navLinks = layoutData?.navLinks ?? null;
  const [sticky, setSticky] = useState(false)
  const [navbarOpen, setNavbarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const sideMenuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement | null>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
      setNavbarOpen(false)
    }
  }

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [pathname, handleScroll])

  // Expose a CSS var with the exact header "bottom" offset so pages can reserve space
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const bottom = Math.max(0, Math.ceil(rect.bottom))
      document.documentElement.style.setProperty('--pp-header-offset', `${bottom}px`)
    }

    update()

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update)
    })
    ro.observe(el)

    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [sticky, navbarOpen, pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (navbarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [navbarOpen])

  const isHomepage = pathname === '/'

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/sign-in";
        },
      },
    });
  };

  return (
    <header ref={headerRef} className={cn(
      "fixed z-50 w-full transition-all duration-500 ease-out",
      sticky ? "top-2 sm:top-2.5 px-2 sm:px-3" : "top-0 px-0"
    )}>
      {/* Top Bar - Only visible on desktop when not sticky */}
      <div className={cn(
        "hidden lg:block transition-all duration-500 overflow-hidden",
        sticky ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
      )}>
        <div className="container mx-auto max-w-8xl">
          <div className={cn(
            "flex items-center justify-between py-1.5 px-6 text-sm border-b transition-colors",
            isHomepage 
              ? "text-white/80 border-white/10" 
              : "text-dark/70 dark:text-white/80 border-dark/10 dark:border-white/10"
          )}>
            <div className="flex items-center gap-6">
              <Link 
                href="mailto:info@psmphuket.com" 
                prefetch={false}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                info@psmphuket.com
              </Link>
              <Link 
                href="tel:+66986261646" 
                prefetch={false}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                +66 (0)98 626 1646
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {socialLinks.slice(0, 4).map((social, index) => (
                <Link 
                  key={index}
                  href={social.href} 
                  prefetch={false}
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="hover:text-primary transition-colors"
                >
                  <social.Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={cn(
        "container mx-auto max-w-8xl flex items-center justify-between transition-all duration-500",
        sticky 
          ? "shadow-xl bg-white/95 dark:bg-dark/95 backdrop-blur-md rounded-full py-1.5 px-4 sm:px-5" 
          : "shadow-none py-2.5 sm:py-3 px-4 sm:px-5"
      )}>
        {/* Left: Logo */}
        <div className="flex items-center gap-5 lg:gap-6">
          <Link href='/' prefetch={false} className="transition-transform duration-300 hover:scale-105">
            <Image
              src='https://ik.imagekit.io/slydc8kod/logo_psm_300.webp?tr=w-80,q-90,f-auto'
              alt='PSM Phuket Real Estate Logo'
              width={80}
              height={36}
              priority={true}
              className={cn(
                "transition-all duration-300",
                sticky 
                  ? 'w-[36px] sm:w-[40px] md:w-[44px] h-auto' 
                  : 'w-[42px] sm:w-[48px] md:w-[54px] lg:w-[62px] h-auto'
              )}
            />
          </Link>

          {/* Desktop Navigation (not hamburger) */}
          <div className="hidden xl:flex items-center gap-1.5">
            {(navLinks ?? [])
              .filter((l) => l.label !== 'Home' && !l.highlight)
              .map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.split('?')[0])
                const hasChildren = !!item.children?.length

                if (!hasChildren) {
                  return (
                    <Link
                      key={`${item.label}:${item.href}`}
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        "px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                        active
                          ? "text-primary bg-primary/10"
                          : isHomepage && !sticky
                            ? "text-white/90 hover:text-white hover:bg-white/10"
                            : "text-dark/70 dark:text-white/70 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                }

                return (
                  <div key={`${item.label}:${item.href}`} className="relative group">
                    <Link
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                        active
                          ? "text-primary bg-primary/10"
                          : isHomepage && !sticky
                            ? "text-white/90 hover:text-white hover:bg-white/10"
                            : "text-dark/70 dark:text-white/70 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                      )}
                      aria-haspopup="menu"
                    >
                      <span>{item.label}</span>
                      <CaretDownBoldIcon className="w-3.5 h-3.5 opacity-70" />
                    </Link>

                    <div className={cn(
                      "absolute left-0 top-full pt-2 z-50",
                      "opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
                      "transition-all duration-200"
                    )}>
                      <div className="min-w-[340px] rounded-2xl border border-white/10 bg-dark/95 backdrop-blur-md shadow-2xl p-3">
                        <div className="grid grid-cols-1 gap-1">
                          {item.children?.map((child) => (
                            <Link
                              key={`${child.label}:${child.href}`}
                              href={child.href}
                              prefetch={false}
                              className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
                            >
                              {child.icon && (
                                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                  <StaticIcon icon={child.icon} className="w-5 h-5" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white">{child.label}</div>
                                {child.description && (
                                  <div className="text-xs text-white/50 line-clamp-1">{child.description}</div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <Link
                            href={item.href}
                            prefetch={false}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-primary transition-colors px-2 py-1"
                          >
                            View all {item.label}
                            <ArrowRightBoldIcon className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          {/* WhatsApp Quick Contact - Desktop */}
          <Link
            href="https://wa.me/66986261646?text=Hello%2C%20I'm%20interested%20in%20PSM%20Phuket%20properties"
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300",
              "bg-[#25D366] text-white hover:bg-[#128C7E] hover:scale-105 shadow-lg shadow-[#25D366]/25"
            )}
          >
            <WhatsappFillIcon className="w-5 h-5" />
            <span>WhatsApp</span>
          </Link>

          {/* List Your Property CTA - Desktop */}
          <Link
            href="/list-your-property"
            prefetch={false}
            className={cn(
              "hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
              "bg-primary text-white hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25"
            )}
          >
            <TagBoldIcon className="w-4 h-4" />
            <span>List Property</span>
          </Link>

          {/* Theme Toggle */}
          <button
            className={cn(
              "p-2 rounded-full transition-all duration-300 hover:scale-110",
              isHomepage && !sticky
                ? "text-white hover:bg-white/10"
                : "text-dark dark:text-white hover:bg-dark/5 dark:hover:bg-white/10"
            )}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <SunBoldIcon className="w-5 h-5 dark:hidden block" />
            <MoonBoldIcon className="w-5 h-5 dark:block hidden" />
          </button>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* User Avatar */}
          {session?.user && (
            <div className="relative group flex items-center justify-center">
              <Image 
                src={session?.user?.image || "https://ik.imagekit.io/slydc8kod/Jum%20(3).png"} 
                alt={`${session?.user?.name || 'User'} avatar`} 
                width={32} 
                height={32} 
                className="rounded-full sm:w-[36px] sm:h-[36px] ring-2 ring-primary/30 transition-all duration-300 group-hover:ring-primary" 
              />
              <div className="absolute w-fit text-sm font-medium text-center z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 bg-dark dark:bg-white text-white dark:text-dark py-2 px-4 min-w-28 rounded-xl shadow-2xl top-full left-1/2 transform -translate-x-1/2 mt-3">
                {session?.user?.name}
              </div>
            </div>
          )}

          {/* Phone Number - Tablet+ */}
          <Link 
            href="tel:+66986261646" 
            prefetch={false}
            className={cn(
              "hidden md:flex lg:hidden items-center gap-2 text-sm font-medium transition-colors",
              isHomepage && !sticky
                ? "text-white hover:text-primary"
                : "text-dark dark:text-white hover:text-primary"
            )}
          >
            <PhoneBoldIcon className="w-5 h-5" />
          </Link>

          {/* Menu Button */}
          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-300 border hover:scale-105",
              isHomepage && !sticky
                ? "text-dark bg-white border-white hover:bg-primary hover:text-white hover:border-primary"
                : sticky
                  ? "text-white bg-dark dark:bg-primary dark:text-white border-dark dark:border-primary hover:bg-primary hover:border-primary"
                  : "bg-dark text-white border-dark hover:bg-primary hover:border-primary dark:bg-white dark:text-dark dark:border-white dark:hover:bg-primary dark:hover:text-white dark:hover:border-primary"
            )}
            aria-label="Toggle navigation menu"
          >
            {navbarOpen ? (
              <XIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" />
            ) : (
              <ListIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" />
            )}
            <span className="hidden xs:block text-sm sm:text-base">Menu</span>
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500 z-40",
          navbarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )} 
        onClick={() => setNavbarOpen(false)}
      />

      {/* Side Menu */}
      <div
        ref={sideMenuRef}
        className={cn(
          "fixed top-0 right-0 h-screen w-full sm:w-[400px] md:w-[420px] lg:w-[440px] bg-gradient-to-b from-dark via-dark to-dark/95 shadow-2xl transition-all duration-500 ease-out z-50 flex flex-col",
          navbarOpen 
            ? "translate-x-0 opacity-100 visible" 
            : "translate-x-full opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Header - Fixed at top */}
        <div className="relative z-10 flex-shrink-0 flex items-center justify-between p-4 sm:p-5 bg-dark">
          <Link href="/" prefetch={false} onClick={() => setNavbarOpen(false)}>
            <Image
              src='https://ik.imagekit.io/slydc8kod/logo_psm_300.webp?tr=w-60,q-90,f-auto'
              alt='PSM Phuket Real Estate Logo'
              width={60}
              height={27}
              className="w-[40px] h-auto brightness-0 invert"
            />
          </Link>
          <button
            onClick={() => setNavbarOpen(false)}
            aria-label="Close navigation menu"
            className="p-2 rounded-full bg-white/10 hover:bg-white hover:text-dark text-white transition-all duration-300 hover:scale-110"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links - Scrollable middle section */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-5 py-2">
          {/* Free Tools Quick Link */}
          <Link
            href="/tools"
            prefetch={false}
            onClick={() => setNavbarOpen(false)}
            className="flex items-center justify-between mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/20 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CalculatorBoldIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">Free Tools</span>
                <p className="text-white/50 text-xs">Property calculators & more</p>
              </div>
            </div>
            <ArrowRightBoldIcon className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
          </Link>

          {/* Favorites Quick Link - Only show when user has favorites */}
          {favoritesCount > 0 && (
            <Link
              href="/properties?favorites=true"
              prefetch={false}
              onClick={() => setNavbarOpen(false)}
              className="flex items-center justify-between mb-3 p-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 hover:from-red-500/30 hover:to-red-500/20 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <HeartFillIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-white font-semibold text-sm">My Favorites</span>
                  <p className="text-white/50 text-xs">{favoritesCount} saved {favoritesCount === 1 ? 'property' : 'properties'}</p>
                </div>
              </div>
              <ArrowRightBoldIcon className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
            </Link>
          )}

          <ul className="space-y-0.5">
            {navLinks && navLinks?.map((item: any, index: number) => (
              <NavLink 
                key={index} 
                item={item} 
                onClick={() => setNavbarOpen(false)} 
              />
            ))}
          </ul>

          {/* Auth Buttons - Compact */}
          <div className="mt-4 pt-4 border-t border-white/10">
            {session?.user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <Image 
                    src={session?.user?.image || "https://ik.imagekit.io/slydc8kod/Jum%20(3).png"} 
                    alt={`${session?.user?.name || 'User'} avatar`}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-primary"
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">{session?.user?.name}</p>
                    <p className="text-white/50 text-xs">{session?.user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link 
                    href="/dashboard" 
                    prefetch={false}
                    onClick={() => setNavbarOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-primary text-white text-center rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="py-2.5 px-4 bg-white/10 text-white rounded-full text-sm font-semibold hover:bg-white hover:text-dark transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link 
                  onClick={() => setNavbarOpen(false)} 
                  href="/sign-in" 
                  prefetch={false}
                  className="flex-1 py-2.5 px-6 bg-primary text-white text-center rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  onClick={() => setNavbarOpen(false)} 
                  href="/sign-up" 
                  prefetch={false}
                  className="flex-1 py-2.5 px-6 bg-white/10 text-white text-center rounded-full text-sm font-semibold hover:bg-white hover:text-dark transition-all duration-300"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Footer Section - Fixed at bottom */}
        <div className="relative z-10 flex-shrink-0 px-4 sm:px-5 py-4 bg-dark border-t border-white/10">
            {/* Quick Contact Actions */}
            <div className="flex gap-2 mb-4">
              <Link
                href="https://wa.me/66986261646?text=Hello%2C%20I'm%20interested%20in%20PSM%20Phuket%20properties"
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition-colors"
              >
                <WhatsappFillIcon className="w-4 h-4" />
                WhatsApp
              </Link>
              <Link
                href="tel:+66986261646"
                prefetch={false}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white hover:text-dark transition-all duration-300"
              >
                <PhoneBoldIcon className="w-4 h-4" />
                Call Now
              </Link>
            </div>

            {/* Contact Info - Compact */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                Contact PSM Phuket
              </p>
              <div className="flex flex-col gap-0.5">
                <Link 
                  href="mailto:info@psmphuket.com" 
                  prefetch={false}
                  className="text-white/80 hover:text-primary transition-colors text-xs flex items-center gap-1.5"
                >
                  <EnvelopeIcon className="w-3.5 h-3.5 text-primary" />
                  info@psmphuket.com
                </Link>
                <Link 
                  href="tel:+66986261646" 
                  prefetch={false}
                  className="text-white/80 hover:text-primary transition-colors text-xs flex items-center gap-1.5"
                >
                  <PhoneIcon className="w-3.5 h-3.5 text-primary" />
                  +66 (0)98 626 1646
                </Link>
                <p className="text-white/50 text-xs flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-primary" />
                  Phuket, Thailand
                </p>
              </div>
            </div>

            {/* Social Links - Compact */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  prefetch={false}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 rounded-full bg-white/5 text-white/70 hover:bg-primary hover:text-white transition-all duration-300"
                >
                  <social.Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>

          {/* Copyright */}
          <p className="text-white/30 text-[10px] mt-3">
            © {new Date().getFullYear()} PSM Phuket. All rights reserved.
          </p>
        </div>
      </div>
    </header>
  )
}

export default Header
