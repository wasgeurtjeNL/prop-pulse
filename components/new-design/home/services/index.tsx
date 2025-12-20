import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

const Services = () => {
  return (
    <section className="relative overflow-hidden !py-12 sm:!py-16 lg:!py-24">
      <div className="absolute left-0 top-0 pointer-events-none">
        <Image
          src="/images/categories/Vector.svg"
          alt="vector"
          width={800}
          height={1050}
          className="dark:hidden max-w-[50vw] sm:max-w-none h-auto"
          unoptimized={true}
        />
        <Image
          src="/images/categories/Vector-dark.svg"
          alt="vector"
          width={800}
          height={1050}
          className="hidden dark:block max-w-[50vw] sm:max-w-none"
          unoptimized={true}
        />
      </div>
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 sm:gap-8 lg:gap-10">
          <div className="lg:col-span-6">
            <p className="text-dark/75 dark:text-white/75 text-sm sm:text-base font-semibold flex items-center gap-2">
              <Icon icon="ph:house-simple-fill" className="text-xl sm:text-2xl text-primary" />
              Property Categories
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-3 sm:mt-4 mb-2 font-medium leading-tight text-dark dark:text-white">
              Premium Properties Across Phuket & Pattaya
            </h2>
            <p className="text-dark/50 dark:text-white/50 text-sm sm:text-base lg:text-lg leading-relaxed">
              From beachfront villas in Phuket to modern condos in Pattaya - discover Thailand's finest properties with expert local guidance and full property management services.
            </p>
            <Link href="/properties" prefetch={false} className="py-3 sm:py-3.5 lg:py-4 px-6 sm:px-7 lg:px-8 bg-primary text-sm sm:text-base leading-4 inline-block w-full xs:w-auto text-center text-white rounded-full font-semibold mt-6 sm:mt-8 hover:bg-dark duration-300">
              View properties
            </Link>
          </div>
          <div className="hidden lg:block lg:col-span-6">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <Link href="/properties?category=residential-home" prefetch={false}>
                <Image
                  src="/images/categories/villas.jpg"
                  alt="Residential homes in Thailand"
                  width={680}
                  height={386}
                  className="w-full h-auto aspect-[16/10] object-cover"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=residential-home" prefetch={false} className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between p-4 sm:p-6 lg:p-10 group-hover:top-0 duration-500">
                <div className="flex justify-end">
                  <div className="bg-white text-dark rounded-full w-fit p-2.5 sm:p-3 lg:p-4">
                    <Icon icon="ph:arrow-right" className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2.5">
                  <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-medium">
                    Residential Homes
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Beautiful family homes perfect for expat living in Thailand. Modern designs with tropical gardens.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-6">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <Link href="/properties?category=luxury-villa" prefetch={false}>
                <Image
                  src="/images/categories/luxury-villa.jpg"
                  alt="Luxury villas in Phuket"
                  width={680}
                  height={386}
                  className="w-full h-auto aspect-[16/10] object-cover"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=luxury-villa" prefetch={false} className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between p-4 sm:p-6 lg:p-10 group-hover:top-0 duration-500">
                <div className="flex justify-end">
                  <div className="bg-white text-dark rounded-full w-fit p-2.5 sm:p-3 lg:p-4">
                    <Icon icon="ph:arrow-right" className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2.5">
                  <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-medium">
                    Luxury Villas
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Stunning beachfront and hillside villas with infinity pools and ocean views.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <Link href="/properties?category=apartment" prefetch={false}>
                <Image
                  src="/images/categories/appartment.jpg"
                  alt="Apartments in Thailand"
                  width={320}
                  height={386}
                  className="w-full h-auto aspect-[4/5] sm:aspect-[3/4] object-cover"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=apartment" prefetch={false} className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between p-4 sm:p-6 group-hover:top-0 duration-500">
                <div className="flex justify-end">
                  <div className="bg-white text-dark rounded-full w-fit p-2.5 sm:p-3">
                    <Icon icon="ph:arrow-right" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <h3 className="text-white text-base sm:text-lg lg:text-xl font-medium">
                    Apartments
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    Modern high-rise apartments with world-class amenities.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              <Link href="/properties?type=FOR_RENT" prefetch={false}>
                <Image
                  src="https://ik.imagekit.io/slydc8kod/landing-pages/ai-generated/phuket-luxury-real-estate-section-1-1765803415374_vObjyLDkE.webp?updatedAt=1765803416903"
                  alt="Rental properties in Thailand"
                  width={320}
                  height={386}
                  className="w-full h-auto aspect-[4/5] sm:aspect-[3/4] object-cover"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?type=FOR_RENT" prefetch={false} className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between p-4 sm:p-6 group-hover:top-0 duration-500">
                <div className="flex justify-end">
                  <div className="bg-white text-dark rounded-full w-fit p-2.5 sm:p-3">
                    <Icon icon="ph:arrow-right" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <h3 className="text-white text-base sm:text-lg lg:text-xl font-medium">
                    Rental Homes
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    Find your perfect rental - from cozy condos to luxury villas, ready to move in.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
