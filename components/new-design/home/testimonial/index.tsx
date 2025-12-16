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
        <section className="bg-dark relative overflow-hidden" id="testimonial">
            <div className="absolute right-0">
                <Image
                    src="/images/testimonial/Vector.png"
                    alt="victor"
                    width={700}
                    height={1039}
                    unoptimized={true}
                />
            </div>
            <div className="container max-w-8xl mx-auto px-4 sm:px-5 2xl:px-0">
                <div>
                    <p className="text-white text-base font-semibold flex gap-2">
                        <Icon icon="ph:house-simple-fill" className="text-2xl text-primary" />
                        Client Success Stories
                    </p>
                    <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-white">
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
                            <CarouselItem key={index} className="mt-9">
                                <div className="lg:flex items-center gap-11">
                                    <div className="flex items-start gap-4 sm:gap-11 lg:pr-20">
                                        <div className="flex-shrink-0">
                                            <Icon icon="ph:house-simple" width={32} height={32} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-lg sm:text-xl lg:text-3xl">{item.review}</h4>
                                            <div className="flex items-center mt-8 gap-6">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                    className="rounded-full lg:hidden block"
                                                    unoptimized={true}
                                                />
                                                <div>
                                                    <h6 className="text-white text-xm font-medium">{item.name}</h6>
                                                    <p className="text-white/40">{item.position}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full h-full rounded-2xl overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={440}
                                            height={440}
                                            className="lg:block hidden"
                                            unoptimized={true}
                                        />
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2.5 p-2.5 bg-white/20 rounded-full">
                    {Array.from({ length: count }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={`w-2.5 h-2.5 rounded-full ${current === index + 1 ? "bg-white" : "bg-white/50"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonial;
