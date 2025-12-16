"use client";
import * as React from "react";
import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "../../ui/carousel";

const FeaturedProperty: React.FC = () => {
  const [api, setApi] = React.useState<CarouselApi | undefined>(undefined);
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [featuredProprty, setFeaturedProprty] = React.useState<any>(null);
  React.useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleDotClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  useEffect(() => {
      const fetchData = async () => {
        try {
          const res = await fetch('/api/page-data')
          if (!res.ok) throw new Error('Failed to fetch')
          const data = await res.json()
          setFeaturedProprty(data?.featuredProprty)
        } catch (error) {
          console.error('Error fetching services:', error)
        }
      }
      fetchData()
    }, [])


  return (
    <section>
      <div className="container max-w-8xl mx-auto px-4 sm:px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="relative">
            <Carousel
              setApi={setApi}
              opts={{
                loop: true,
              }}
            >
              <CarouselContent>
                {featuredProprty && featuredProprty?.map((item:any, index:any) => (
                  <CarouselItem key={index}>
                    <Image
                      src={item.scr}
                      alt={item.alt}
                      width={680}
                      height={530}
                      className="rounded-2xl w-full h-auto max-h-[540px] object-cover"
                      unoptimized={true}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <div className="absolute left-1/2 -translate-x-1/2 bg-dark/50 rounded-full py-2.5 bottom-4 sm:bottom-10 flex justify-center mt-4 gap-2.5 px-2.5">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2.5 h-2.5 rounded-full ${current === index + 1 ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
                <Icon icon="ph:house-simple-fill" className="text-2xl text-primary " />
                Featured Property
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white">
                Beachfront Luxury Villa
              </h2>
              <div className="flex items-center gap-2.5">
                <Icon icon="ph:map-pin" width={28} height={26} className="text-dark/50 dark:text-white/50" />
                <p className="text-dark/50 dark:text-white/50 text-base">
                  Patong Beach, Phuket, Thailand
                </p>
              </div>
            </div>
            <p className="text-base text-dark/50 dark:text-white/50">
              Experience ultimate tropical luxury at this stunning beachfront villa in Patong Beach, Phuket. This 560 m² architectural masterpiece offers 4 spacious 
              bedrooms, 3 designer bathrooms, infinity pool with Andaman Sea views, and premium finishes throughout. Perfect for families or as a high-yield investment 
              property with strong rental potential. Complete property management services available.
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-6 sm:gap-10">
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/sofa.svg'}
                    alt='sofa'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-sofa.svg'}
                    alt='sofa'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">4 Bedrooms</h6>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/tube.svg'}
                    alt='tube'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-tube.svg'}
                    alt='tube'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">3 Bathrooms</h6>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/parking.svg'}
                    alt='parking'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-parking.svg'}
                    alt='parking'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">Parking Space</h6>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/bar.svg'}
                    alt='bar'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-bar.svg'}
                    alt='bar'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">2 Bar areas</h6>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center">
              <Link href="/contactus" className="w-full sm:w-auto text-center py-4 px-6 sm:px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white">
                Schedule Viewing
              </Link>
              <div>
                <h4 className="text-2xl sm:text-3xl text-dark dark:text-white font-medium">
                  ฿58,500,000
                </h4>
                <p className="text-sm sm:text-base text-dark/50">
                  Approx. $1,650,500 USD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperty;
