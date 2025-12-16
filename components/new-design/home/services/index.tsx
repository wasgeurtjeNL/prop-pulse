import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

const Services = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute left-0 top-0">
        <Image
          src="/images/categories/Vector.svg"
          alt="vector"
          width={800}
          height={1050}
          className="dark:hidden"
          unoptimized={true}
        />
        <Image
          src="/images/categories/Vector-dark.svg"
          alt="vector"
          width={800}
          height={1050}
          className="hidden dark:block"
          unoptimized={true}
        />
      </div>
      <div className="container max-w-8xl mx-auto px-4 sm:px-5 2xl:px-0 relative z-10">
        <div className="grid grid-cols-12 items-center gap-6 sm:gap-10">
          <div className="lg:col-span-6 col-span-12">
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2.5">
              <Icon icon="ph:house-simple-fill" className="text-2xl text-primary " />
              Property Categories
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-52 mt-4 mb-2 lg:max-w-full font-medium leading-[1.2] text-dark dark:text-white">
              Premium Properties Across Phuket & Pattaya
            </h2>
            <p className="text-dark/50 dark:text-white/50 text-base sm:text-lg lg:max-w-full leading-[1.3] md:max-w-3/4">
              From beachfront villas in Phuket to modern condos in Pattaya - discover Thailand's finest properties with expert local guidance and full property management services.
            </p>
            <Link href="/properties" className="py-4 px-8 bg-primary text-base leading-4 block w-fit text-white rounded-full font-semibold mt-8 hover:bg-dark duration-300">
              View properties
            </Link>
          </div>
          <div className="lg:col-span-6 col-span-12">
            <div className="relative rounded-2xl overflow-hidden group">
              <Link href="/properties?category=residential-home">
                <Image
                  src="/images/categories/villas.jpg"
                  alt="villas"
                  width={680}
                  height={386}
                  className="w-full"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=residential-home" className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-6 sm:pl-10 pb-6 sm:pb-10 group-hover:top-0 duration-500">
                <div className="flex justify-end mt-6 mr-6">
                  <div className="bg-white text-dark rounded-full w-fit p-4">
                    <Icon icon="ph:arrow-right" width={24} height={24} />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-white text-xl sm:text-2xl">
                    Residential Homes
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-6">
                    Beautiful family homes perfect for expat living in Thailand. Modern designs with tropical gardens, ideal for permanent residence or vacation homes.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 col-span-12">
            <div className="relative rounded-2xl overflow-hidden group">
              <Link href="/properties?category=luxury-villa">
                <Image
                  src="/images/categories/luxury-villa.jpg"
                  alt="villas"
                  width={680}
                  height={386}
                  className="w-full"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=luxury-villa" className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-6 sm:pl-10 pb-6 sm:pb-10 group-hover:top-0 duration-500">
                <div className="flex justify-end mt-6 mr-6">
                  <div className="bg-white text-dark rounded-full w-fit p-4">
                    <Icon icon="ph:arrow-right" width={24} height={24} />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-white text-xl sm:text-2xl">
                    Luxury Villas
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-6">
                    Stunning beachfront and hillside villas with infinity pools, ocean views, and premium finishes. The ultimate tropical paradise lifestyle in Phuket and Pattaya.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-3 col-span-6">
            <div className="relative rounded-2xl overflow-hidden group">
              <Link href="/properties?category=apartment">
                <Image
                  src="/images/categories/appartment.jpg"
                  alt="villas"
                  width={320}
                  height={386}
                  className="w-full"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=apartment" className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-6 sm:pl-10 pb-6 sm:pb-10 group-hover:top-0 duration-500">
                <div className="flex justify-end mt-6 mr-6">
                  <div className="bg-white text-dark rounded-full w-fit p-4">
                    <Icon icon="ph:arrow-right" width={24} height={24} />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-white text-xl sm:text-2xl">
                    Apartments
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-6">
                    Modern high-rise apartments with world-class amenities. Perfect for investment properties with strong rental yields and easy maintenance.
                  </p>
                </div>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-3 col-span-6">
            <div className="relative rounded-2xl overflow-hidden group">
              <Link href="/properties?category=office-spaces">
                <Image
                  src="/images/categories/office.jpg"
                  alt="office"
                  width={320}
                  height={386}
                  className="w-full"
                  unoptimized={true}
                />
              </Link>
              <Link href="/properties?category=office-spaces" className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-6 sm:pl-10 pb-6 sm:pb-10 group-hover:top-0 duration-500">
                <div className="flex justify-end mt-6 mr-6">
                  <div className="bg-white text-dark rounded-full w-fit p-4">
                    <Icon icon="ph:arrow-right" width={24} height={24} />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-white text-xl sm:text-2xl">
                    Commercial Spaces
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-6">
                    Prime commercial real estate in high-traffic areas. Restaurants, shops, and office spaces in Thailand's most vibrant coastal cities.
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
