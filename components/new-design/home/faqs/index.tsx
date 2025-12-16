import { Icon } from '@iconify/react';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';

const FAQ: React.FC = () => {
    return (
        <section id='faqs' className='!py-12 sm:!py-16 lg:!py-24'>
            <div className='w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0'>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                    <div className='order-2 lg:order-1 mx-auto lg:mx-0'>
                        <Image
                            src="/images/faqs/faq-image.png"
                            alt='FAQ illustration'
                            width={680}
                            height={644}
                            className='w-full max-w-md lg:max-w-none'
                            unoptimized={true}
                        />
                    </div>
                    <div className='order-1 lg:order-2 lg:px-8 xl:px-12'>
                        <p className="text-dark/75 dark:text-white/75 text-sm sm:text-base font-semibold flex items-center gap-2">
                            <Icon icon="ph:house-simple-fill" className="text-xl sm:text-2xl text-primary" />
                            FAQs
                        </p>
                        <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight font-medium text-dark dark:text-white mt-2'>
                            Your Thailand Property Questions Answered
                        </h2>
                        <p className='text-sm sm:text-base text-dark/50 dark:text-white/50 mt-3 sm:mt-4'>
                            Investing in Thai real estate as an expat can seem complex. Here are answers to the most common questions about buying, owning, and managing properties in Phuket and Pattaya.
                        </p>
                        <div className="my-6 sm:my-8">
                            <Accordion type="single" defaultValue="item-1" collapsible className="w-full flex flex-col gap-3 sm:gap-4 lg:gap-6">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>1. Can foreigners own property in Thailand?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes! Foreigners can own condominiums freehold up to 49% of the total unit space in a building. For land and houses, foreigners can lease for up to 30 years (renewable). We guide you through all legal structures including Thai company formation and long-term leases to ensure secure ownership.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>2. What are the costs involved in buying property?</AccordionTrigger>
                                    <AccordionContent>
                                        Beyond the purchase price, expect transfer fees (approx. 2%), specific business tax or stamp duty (0.5-3.3%), and potential withholding tax. Our team provides detailed cost breakdowns and can recommend trusted legal advisors. Total additional costs typically range from 3-6% of the property value.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>3. Do you offer property management services?</AccordionTrigger>
                                    <AccordionContent>
                                        Absolutely! PSM Phuket provides comprehensive property management including tenant screening, rent collection, maintenance, repairs, and 24/7 emergency support. Perfect for international investors who want hassle-free rental income from their Phuket or Pattaya properties.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
