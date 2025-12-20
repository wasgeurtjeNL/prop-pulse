"use client";
import Link from "next/link";
import { Icon } from "@iconify/react"
import { useLayoutData } from "@/lib/contexts/layout-data-context";

const Footer = () => {
  const { data: layoutData } = useLayoutData();
  const footerLinks = layoutData?.footerLinks ?? null;
  return (
    <footer className="relative z-10 bg-dark mb-0 pb-0">
      <div className="container mx-auto max-w-8xl pt-14 px-4 sm:px-6 lg:px-0">
        <div className="flex lg:items-center justify-between items-end lg:gap-11 pb-14 border-b border-white/10 lg:flex-nowrap flex-wrap gap-6">
          <p className="text-white text-sm lg:max-w-1/5">
            Stay updated with new property listings,
            market insights, and exclusive investment opportunities in Phuket & Pattaya.
          </p>
          <div className="flex lg:flex-row flex-col items-center lg:gap-10 gap-3">
            <div className="flex gap-2 lg:order-1 order-2">
              <input type="email" placeholder="Enter Your Email" className="rounded-full py-4 px-6 bg-white/10 placeholder:text-white text-white focus-visible:outline-0" />
              <button className="text-dark bg-white py-4 px-8 font-semibold rounded-full hover:bg-primary hover:text-white duration-300 hover:cursor-pointer">
                Subscribe
              </button>
            </div>
            <p className="text-white/40 text-sm lg:max-w-[45%] order-1 lg:order-2">
              By subscribing, you agree to receive our promotional emails. You can unsubscribe  at any time.
            </p>
          </div>
          <div className="flex items-center gap-6" role="list" aria-label="Social media links">
            <Link href="https://twitter.com/psmphuket" prefetch={false} target="_blank" rel="noopener noreferrer" aria-label="Follow us on X (Twitter)" role="listitem">
              <Icon icon="ph:x-logo-bold" width={24} height={24} className="text-white hover:text-primary duration-300" aria-hidden="true" />
            </Link>
            <Link href="https://facebook.com/psmphuket" prefetch={false} target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook" role="listitem">
              <Icon icon="ph:facebook-logo-bold" width={24} height={24} className="text-white hover:text-primary duration-300" aria-hidden="true" />
            </Link>
            <Link href="https://instagram.com/psmphuket" prefetch={false} target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" role="listitem">
              <Icon icon="ph:instagram-logo-bold" width={24} height={24} className="text-white hover:text-primary duration-300" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="py-16 border-b border-white/10">
          <div className="grid grid-cols-12 sm:gap-10 gap-y-6">
            <div className="md:col-span-7 col-span-12">
              <h2 className="text-white leading-[1.2] text-40 font-medium mb-6 lg:max-w-3/4">
                Ready to find your tropical paradise? Let's start your property journey today.
              </h2>
              <Link href="/contactus" prefetch={false} className="bg-primary text-base font-semibold py-4 px-8 rounded-full text-white hover:bg-white hover:text-dark duration-300 hover:cursor-pointer">
                Contact PSM Phuket
              </Link>
            </div>
            <div className="md:col-span-3 sm:col-span-6 col-span-12">
              <div className="flex flex-col gap-4 w-fit">
                {footerLinks?.slice(0, 4)?.map((item:any, index:any) => (
                  <div key={index}>
                    <Link href={item.href} prefetch={false} className="text-white/40 text-xm hover:text-white">
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 sm:col-span-6 col-span-12">
              <div className="flex flex-col gap-4 w-fit">
                {footerLinks?.slice(4, 8)?.map((item:any, index:any) => (
                  <div key={index}>
                    <Link href={item.href} prefetch={false} className="text-white/40 text-xm hover:text-white">
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between md:flex-nowrap flex-wrap items-center py-6 gap-6">
          <p className="text-white/40 text-sm ">
            ©2025 PSM Phuket - Premium Property Management in Phuket & Pattaya, Thailand
          </p>
          <div className="flex gap-8 items-center">
            <Link href="/terms-and-conditions" prefetch={false} className="text-white/40 hover:text-primary text-sm">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" prefetch={false} className="text-white/40 hover:text-primary text-sm">
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;