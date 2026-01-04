"use client";
import * as React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "../../ui/carousel";

const Testimonial = () => {
    const [api, setApi] = React.useState<CarouselApi | undefined>(undefined);
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);
    const [testimonials, setTestimonials] = React.useState<any>(null);

    React.useEffect(() => {
        if (!api) return;

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

    React.useEffect(() => {
          const fetchData = async () => {
            try {
              const res = await fetch('/api/page-data')
              if (!res.ok) throw new Error('Failed to fetch')
              const data = await res.json()
              setTestimonials(data?.testimonials)
            } catch (error) {
              console.error('Error fetching services:', error)
            }
          }
          fetchData()
        }, [])

    return (
        <section className="bg-dark relative overflow-hidden !py-12 sm:!py-16 lg:!py-24" id="testimonial">
            <div className="absolute right-0 top-0 opacity-50 sm:opacity-100 pointer-events-none">
                <Image
                    src="/images/testimonial/Vector.png"
                    alt="decorative pattern"
                    width={700}
                    height={1039}
                    className="max-w-[50vw] sm:max-w-none"
                    loading="lazy"
                />
            </div>
            <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0 relative z-10">
                <div>
                    <p className="text-white text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Icon icon="ph:house-simple-fill" className="text-xl sm:text-2xl text-primary" />
                        Client Success Stories
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white mt-1">
                        Why Clients Choose PSM Phuket
                    </h2>
                </div>
                <Carousel
                    setApi={setApi}
                    opts={{
                        loop: true,
                    }}
                >
                    <CarouselContent>
                        {testimonials && testimonials?.map((item:any, index:any) => (
                            <CarouselItem key={index} className="mt-6 sm:mt-8 lg:mt-9">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-11">
                                    <div className="flex items-start gap-3 sm:gap-4 lg:gap-11 lg:pr-20 flex-1">
                                        <div className="flex-shrink-0 hidden sm:block">
                                            <Icon icon="ph:house-simple" className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl leading-relaxed">{item.review}</h4>
                                            <div className="flex items-center mt-5 sm:mt-6 lg:mt-8 gap-4 sm:gap-6">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                    className="rounded-full lg:hidden block w-12 h-12 sm:w-16 sm:h-16 object-cover"
                                                    loading="lazy"
                                                />
                                                <div>
                                                    <h6 className="text-white text-sm sm:text-base lg:text-lg font-medium">{item.name}</h6>
                                                    <p className="text-white/40 text-xs sm:text-sm">{item.position}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden lg:block w-full max-w-[200px] xl:max-w-[260px] rounded-2xl overflow-hidden flex-shrink-0">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={260}
                                            height={260}
                                            className="w-full h-auto object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                <div className="flex justify-center mt-8 sm:mt-10 lg:mt-0 lg:absolute lg:bottom-24 lg:left-1/2 lg:transform lg:-translate-x-1/2">
                    <div className="flex gap-2 sm:gap-2.5 p-2 sm:p-2.5 bg-white/20 rounded-full">
                        {Array.from({ length: count }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${current === index + 1 ? "bg-white" : "bg-white/50"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonial;
