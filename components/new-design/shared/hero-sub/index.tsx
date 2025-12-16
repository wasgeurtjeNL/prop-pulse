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
        <div className="text-center container mx-auto px-4">
            {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
            <div className='flex gap-1 items-center justify-center'>
                <Icon icon={'ph:house-simple-fill'} width={12} height={12} className='text-primary' />
                <span className='text-[10px] font-semibold text-dark/60 dark:text-white/60'>{badge}</span>
            </div>
            <h1 className="text-dark text-base sm:text-lg md:text-xl font-bold dark:text-white leading-none mt-2">{title}</h1>
            <p className="text-[10px] sm:text-xs text-dark/40 dark:text-white/40 leading-none">{description}</p>
        </div>
    );
};

export default HeroSub;
