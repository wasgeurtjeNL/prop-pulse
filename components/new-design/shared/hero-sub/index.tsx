import React, { FC } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Breadcrumb, { BreadcrumbItem } from "@/components/new-design/breadcrumb";

interface HeroSubProps {
    title: string;
    description: string;
    badge: string;
    /** Optional breadcrumb items (Home is automatically added) */
    breadcrumbs?: BreadcrumbItem[];
}

const HeroSub: FC<HeroSubProps> = ({ title, description, badge, breadcrumbs }) => {
    return (
        <section className="text-center bg-cover pt-20 lg:pt-24 pb-2 relative overflow-x-hidden">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="container mx-auto px-4 mb-6">
                    <Breadcrumb items={breadcrumbs} />
                </div>
            )}
            
            <div className='flex gap-2.5 items-center justify-center'>
                <span>
                    <Icon
                        icon={'ph:house-simple-fill'}
                        width={20}
                        height={20}
                        className='text-primary'
                    />
                </span>
                <p className='text-base font-semibold text-dark/75 dark:text-white/75'>
                    {badge}
                </p>
            </div>
            <h1 className="text-dark text-52 relative font-bold dark:text-white">{title}</h1>
            <p className="text-lg text-dark/50 dark:text-white/50 font-normal w-full mx-auto">
                {description}
            </p>
        </section>
    );
};

export default HeroSub;
