// #region agent log
'use client'
// #endregion
import Image from 'next/image'
import Link from 'next/link'
// #region agent log
import { useEffect, useRef } from 'react'
// #endregion

const Hero: React.FC = () => {
  // #region agent log
  const sectionRef = useRef<HTMLElement>(null)
  const gradientRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const measure = () => {
      const viewport = { width: window.innerWidth, height: window.innerHeight }
      const clientWidth = document.documentElement.clientWidth
      const scrollWidth = document.documentElement.scrollWidth
      
      // Find elements causing overflow
      const overflowingElements: {tag: string, class: string, width: number, right: number}[] = []
      if (scrollWidth > clientWidth) {
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect()
          if (rect.right > clientWidth + 5) { // 5px tolerance
            overflowingElements.push({
              tag: el.tagName,
              class: el.className?.toString()?.slice(0, 100) || '',
              width: rect.width,
              right: rect.right
            })
          }
        })
      }
      
      fetch('http://127.0.0.1:7243/ingest/1d474df5-ab02-44e6-b823-60dcc3ad7dc4',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          location:'hero/index.tsx:measure',
          message:'Hero overflow detection v3',
          hypothesisId:'I',
          data:{
            viewport,
            clientWidth,
            scrollWidth,
            hasOverflow: scrollWidth > clientWidth,
            overflowAmount: scrollWidth - clientWidth,
            overflowingElements: overflowingElements.slice(0, 10), // First 10
            visualViewportScale: window.visualViewport?.scale
          },
          timestamp:Date.now(),
          sessionId:'debug-session'
        })
      }).catch(()=>{});
    }
    
    // Measure on load and resize
    setTimeout(measure, 500) // Delay to ensure page is fully loaded
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  // #endregion

  return (
    <section ref={sectionRef} className='!py-0 overflow-x-hidden w-full'>
      <div ref={gradientRef} className='w-full bg-gradient-to-b from-skyblue via-lightskyblue dark:via-[#4298b0] to-white/10 dark:to-black/10 overflow-hidden relative'>
        <div ref={containerRef} className='w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0 pt-16 sm:pt-20 lg:pt-24 pb-0 md:pb-68'>
          <div className='relative text-white dark:text-dark text-center md:text-start z-10'>
            <p className='text-inherit text-xs sm:text-sm font-medium'>Phuket & Pattaya, Thailand</p>
            <h1 className='text-inherit text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-semibold -tracking-wider md:max-w-[55%] lg:max-w-45p mt-3 sm:mt-4 mb-5 sm:mb-6 leading-tight'>
              Your Tropical Paradise Awaits
            </h1>
            <div className='flex flex-col xs:flex-row justify-center md:justify-start gap-3 sm:gap-4'>
              <Link href="/contactus" className='px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 border border-white dark:border-dark bg-white dark:bg-dark text-dark dark:text-white duration-300 dark:hover:text-dark hover:bg-transparent hover:text-white text-sm sm:text-base font-semibold rounded-full hover:cursor-pointer text-center'>
                Schedule Viewing
              </Link>
              <Link href={"/properties"} className='px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 border border-white dark:border-dark bg-transparent text-white dark:text-dark hover:bg-white dark:hover:bg-dark dark:hover:text-white hover:text-dark duration-300 text-sm sm:text-base font-semibold rounded-full hover:cursor-pointer text-center'>
                Explore Properties
              </Link>
            </div>
          </div>
          <div className='hidden lg:block absolute -top-2 -right-68 xl:right-0'>
            <Image
              src={'/images/hero/heroBanner.png'}
              alt='heroImg'
              width={1082}
              height={1016}
              priority={true}
              unoptimized={true}
              className='max-w-full h-auto'
            />
          </div>
        </div>
        <div className='w-full md:w-auto md:absolute bottom-0 md:-right-68 xl:right-0 bg-white dark:bg-black py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-16 md:pr-[295px] rounded-none md:rounded-none md:rounded-tl-2xl mt-12 sm:mt-16 md:mt-24'>
          <div className='grid grid-cols-2 sm:grid-cols-4 md:flex gap-4 sm:gap-6 md:gap-10 lg:gap-16 xl:gap-24 text-left sm:text-center dark:text-white text-black'>
            <div className='flex flex-col sm:items-center gap-2 sm:gap-3'>
              <Image
                src={'/images/hero/sofa.svg'}
                alt='sofa'
                width={28}
                height={28}
                className='block dark:hidden w-6 h-6 sm:w-8 sm:h-8'
                unoptimized={true}
              />
              <Image
                src={'/images/hero/dark-sofa.svg'}
                alt='sofa'
                width={28}
                height={28}
                className='hidden dark:block w-6 h-6 sm:w-8 sm:h-8'
                unoptimized={true}
              />
              <p className='text-xs sm:text-sm md:text-base font-normal text-inherit'>
                4 Bedrooms
              </p>
            </div>
            <div className='flex flex-col sm:items-center gap-2 sm:gap-3'>
              <Image
                src={'/images/hero/tube.svg'}
                alt='bathroom'
                width={28}
                height={28}
                className='block dark:hidden w-6 h-6 sm:w-8 sm:h-8'
                unoptimized={true}
              />
              <Image
                src={'/images/hero/dark-tube.svg'}
                alt='bathroom'
                width={28}
                height={28}
                className='hidden dark:block w-6 h-6 sm:w-8 sm:h-8'
                unoptimized={true}
              />
              <p className='text-xs sm:text-sm md:text-base font-normal text-inherit'>
                4 Restroom
              </p>
            </div>
            <div className='flex flex-col sm:items-center gap-2 sm:gap-3'>
              <Image
                src={'/images/hero/parking.svg'}
                alt='parking'
                width={28}
                height={28}
                className='block dark:hidden w-6 h-6 sm:w-8 sm:h-8'
                unoptimized={true}
              />
              <Image
                src={'/images/hero/dark-parking.svg'}
                alt='parking'
                width={28}
                height={28}
                className='hidden dark:block w-6 h-6 sm:w-8 sm:h-8'
                unoptimized={true}
              />
              <p className='text-xs sm:text-sm md:text-base font-normal text-inherit'>
                Parking space
              </p>
            </div>
            <div className='flex flex-col sm:items-center gap-1 sm:gap-3'>
              <p className='text-xl sm:text-2xl md:text-3xl font-medium text-inherit'>
                $4,750,000
              </p>
              <p className='text-xs sm:text-sm md:text-base font-normal text-black/50 dark:text-white/50'>
                For selling price
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
