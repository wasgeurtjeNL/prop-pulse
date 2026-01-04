import Image from 'next/image';
import Link from 'next/link';

/**
 * Static Header Shell - Server Component
 * 
 * Renders immediately without JavaScript to prevent blank header during hydration.
 * The full interactive header will hydrate on top of this.
 * 
 * This is critical for LCP as it ensures the header layout is visible immediately.
 */
const HeaderShell: React.FC = () => {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-transparent"
      style={{ contain: 'layout' }}
    >
      {/* Top bar - matches the real header structure */}
      <div className="hidden lg:block py-3 bg-gradient-to-r from-[#004aac] to-[#0066cc] text-white">
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <span>info@psmphuket.com</span>
              <span>+66 (0)98 626 1646</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Placeholder for social icons */}
              <div className="w-4 h-4 rounded-full bg-white/20" />
              <div className="w-4 h-4 rounded-full bg-white/20" />
              <div className="w-4 h-4 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main nav - simplified static version */}
      <nav className="bg-transparent py-4">
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="https://ik.imagekit.io/slydc8kod/logo_psm_300.webp?updatedAt=1765040666333"
                alt="PSM Phuket Real Estate Logo"
                width={62}
                height={28}
                priority
                className="w-[42px] sm:w-[48px] md:w-[54px] lg:w-[62px] h-auto"
              />
            </Link>
            
            {/* Navigation placeholder - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-8">
              <div className="w-20 h-4 bg-transparent" />
              <div className="w-16 h-4 bg-transparent" />
              <div className="w-16 h-4 bg-transparent" />
              <div className="w-20 h-4 bg-transparent" />
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block w-24 h-9 rounded-full bg-transparent" />
              <div className="w-16 h-9 rounded-full bg-transparent" />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default HeaderShell;

