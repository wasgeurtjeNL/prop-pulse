import { NavLinks } from '@/types/navlink'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useState } from 'react'

interface NavLinkProps {
  item: NavLinks
  onClick: () => void
}

const NavLink: React.FC<NavLinkProps> = ({ item, onClick }) => {
  const path = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const isActiveLink = (href: string) => {
    if (href === '/') return path === '/'
    return path.startsWith(href.split('?')[0])
  }

  const hasChildren = item.children && item.children.length > 0

  // Special styling for highlighted items (like "Sell Your Property")
  if (item.highlight) {
    return (
      <li className="w-full mt-4 mb-2">
        <Link 
          href={item.href} 
          className="group flex items-center gap-3 py-4 px-6 bg-gradient-to-r from-primary to-primary/80 text-white text-lg sm:text-xl font-semibold rounded-2xl hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25"
          onClick={onClick}
        >
          {item.icon && (
            <span className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <Icon icon={item.icon} className="w-5 h-5" />
            </span>
          )}
          <span>{item.label}</span>
          <Icon icon="ph:arrow-right" className="w-5 h-5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </Link>
      </li>
    )
  }

  // Items with submenu
  if (hasChildren) {
    return (
      <li className="w-full">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center justify-between w-full py-3 px-2 rounded-xl hover:bg-white/5 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-1 h-8 rounded-full bg-primary transition-all duration-300 origin-center',
              isActiveLink(item.href) || isExpanded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
            )} />
            <span className={cn(
              'text-2xl sm:text-3xl font-semibold transition-colors duration-300',
              isActiveLink(item.href) || isExpanded
                ? 'text-white' 
                : 'text-white/50 group-hover:text-white/80'
            )}>
              {item.label}
            </span>
          </div>
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            isExpanded ? "bg-primary/20 rotate-180" : "bg-white/5 group-hover:bg-white/10"
          )}>
            <Icon 
              icon="ph:caret-down" 
              className={cn(
                'w-5 h-5 transition-colors',
                isExpanded ? 'text-primary' : 'text-white/40 group-hover:text-white/70'
              )}
            />
          </div>
        </button>
        
        {/* Submenu items */}
        <ul className={cn(
          'overflow-hidden transition-all duration-500 ease-out ml-4 border-l border-white/10',
          isExpanded ? 'max-h-[600px] opacity-100 mt-2 mb-4' : 'max-h-0 opacity-0'
        )}>
          {item.children?.map((child, index) => (
            <li 
              key={index} 
              className="group/child"
              style={{ 
                transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              }}
            >
              <Link 
                href={child.href}
                onClick={onClick}
                className={cn(
                  "flex items-center gap-4 py-3 px-4 ml-2 rounded-xl transition-all duration-300",
                  isActiveLink(child.href)
                    ? "bg-primary/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {child.icon && (
                  <span className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActiveLink(child.href)
                      ? "bg-primary/20 text-primary"
                      : "bg-white/5 text-white/50 group-hover/child:bg-primary/10 group-hover/child:text-primary"
                  )}>
                    <Icon 
                      icon={child.icon} 
                      className="w-5 h-5" 
                    />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-base sm:text-lg font-medium block">
                    {child.label}
                  </span>
                  {child.description && (
                    <span className="text-sm text-white/40 block truncate">
                      {child.description}
                    </span>
                  )}
                </div>
                <Icon 
                  icon="ph:arrow-right" 
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isActiveLink(child.href)
                      ? "opacity-100 text-primary"
                      : "opacity-0 -translate-x-2 group-hover/child:opacity-100 group-hover/child:translate-x-0 text-white/40"
                  )} 
                />
              </Link>
            </li>
          ))}
        </ul>
      </li>
    )
  }

  // Regular link without children
  return (
    <li className="w-full">
      <Link 
        href={item.href} 
        className={cn(
          'group flex items-center gap-3 py-3 px-2 rounded-xl transition-all duration-300',
          isActiveLink(item.href) 
            ? 'bg-white/5' 
            : 'hover:bg-white/5'
        )} 
        onClick={onClick}
      >
        <div className={cn(
          'w-1 h-8 rounded-full bg-primary transition-all duration-300 origin-center',
          isActiveLink(item.href) ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 group-hover:opacity-50 group-hover:scale-y-50'
        )} />
        <span className={cn(
          'text-2xl sm:text-3xl font-semibold transition-colors duration-300',
          isActiveLink(item.href) 
            ? 'text-white' 
            : 'text-white/50 group-hover:text-white/80'
        )}>
          {item.label}
        </span>
        <Icon 
          icon="ph:arrow-right" 
          className={cn(
            "w-6 h-6 ml-auto transition-all duration-300",
            isActiveLink(item.href)
              ? "opacity-100 text-primary"
              : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-white/40"
          )} 
        />
      </Link>
    </li>
  )
}

export default NavLink
