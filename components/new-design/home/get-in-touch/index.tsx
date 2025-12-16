import Link from 'next/link';

const GetInTouch: React.FC = () => {
    return (
        <section className='!py-8 sm:!py-12 lg:!py-16'>
            <div className='w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0'>
                <div className="relative rounded-t-xl sm:rounded-t-2xl overflow-hidden">
                    <video
                        className="w-full h-full absolute top-0 left-0 object-cover -z-10"
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-label="Video background showing luxurious real estate"
                    >
                        <source src="https://videos.pexels.com/video-files/7233782/7233782-hd_1920_1080_25fps.mp4" type="video/mp4" />
                    </video>

                    <div className="bg-black/40 py-12 sm:py-20 md:py-28 lg:py-40 xl:py-64 px-4 sm:px-6">
                        <div className="flex flex-col items-center gap-5 sm:gap-6 lg:gap-8">
                            <h2 className='text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl max-w-[90%] sm:max-w-[85%] lg:max-w-3/4 text-center font-medium leading-tight'>
                                Live the tropical dream. Invest in Thailand's premier coastal destinations.
                            </h2>
                            <Link href="/contactus" className='bg-white py-3 sm:py-3.5 lg:py-4 px-6 sm:px-7 lg:px-8 rounded-full text-dark text-sm sm:text-base font-semibold hover:bg-dark hover:text-white duration-300'>
                                Start Your Journey
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="w-full py-3 sm:py-4 lg:py-5 bg-primary rounded-b-xl sm:rounded-b-2xl overflow-hidden">
                    <div className="flex items-center gap-16 sm:gap-24 lg:gap-40 animate-slide text-xs sm:text-sm lg:text-base">
                        <p className='text-white whitespace-nowrap relative after:absolute after:w-12 sm:after:w-16 lg:after:w-20 after:h-px after:bg-white after:top-2 sm:after:top-3 after:-right-20 sm:after:-right-24 lg:after:-right-32'>
                            FREE PROPERTY CONSULTATION
                        </p>
                        <p className='text-white whitespace-nowrap relative after:absolute after:w-12 sm:after:w-16 lg:after:w-20 after:h-px after:bg-white after:top-2 sm:after:top-3 after:-right-20 sm:after:-right-24 lg:after:-right-32'>
                            BEACHFRONT VILLAS • LUXURY CONDOS
                        </p>
                        <p className='text-white whitespace-nowrap relative after:absolute after:w-12 sm:after:w-16 lg:after:w-20 after:h-px after:bg-white after:top-2 sm:after:top-3 after:-right-20 sm:after:-right-24 lg:after:-right-32'>
                            FULL PROPERTY MANAGEMENT
                        </p>
                        <p className='text-white whitespace-nowrap relative after:absolute after:w-12 sm:after:w-16 lg:after:w-20 after:h-px after:bg-white after:top-2 sm:after:top-3 after:-right-20 sm:after:-right-24 lg:after:-right-32'>
                            EXPERT LOCAL GUIDANCE
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GetInTouch;