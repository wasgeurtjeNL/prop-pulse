import React, { FC } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Breadcrumb, { BreadcrumbItem } from "@/components/new-design/breadcrumb";

interface HeroSubProps {
    title: string;
    description: string;
    badge: string;
    /** Optional breadcrumb items (Home is automatically added) */
    breadcrumbs?: BreadcrumbItem[];
    /** Optional property count to display */
    propertyCount?: number;
    /** Optional loading state */
    isLoading?: boolean;
}

const HeroSub: FC<HeroSubProps> = ({ title, description, badge, breadcrumbs, propertyCount, isLoading }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-dark dark:via-dark dark:to-primary/10 py-8 sm:py-12 mb-6">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary/40 rounded-full" />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-primary/20 rounded-full" />
            <div className="absolute bottom-1/4 right-1/5 w-1.5 h-1.5 bg-primary/30 rounded-full" />
            
            <div className="container max-w-8xl mx-auto px-5 2xl:px-0 relative z-10">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <Breadcrumb items={breadcrumbs} className="mb-4" />
                )}
                
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    {/* Left: Title Section */}
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                            <Icon icon={'ph:buildings-fill'} width={14} height={14} className="text-primary" />
                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">{badge}</span>
                        </div>
                        
                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-white leading-tight mb-3">
                            {title}
                        </h1>
                        
                        {/* Description */}
                        <p className="text-sm sm:text-base text-dark/60 dark:text-white/60 leading-relaxed max-w-xl">
                            {description}
                        </p>
                    </div>
                    
                    {/* Right: Stats */}
                    {propertyCount !== undefined && (
                        <div className="flex items-center gap-3 lg:flex-shrink-0">
                            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Icon icon={'ph:house-line-fill'} width={20} height={20} className="text-primary" />
                                </div>
                                <div>
                                    {isLoading ? (
                                        <div className="h-6 w-12 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                    ) : (
                                        <p className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
                                            {propertyCount}
                                        </p>
                                    )}
                                    <p className="text-xs text-dark/50 dark:text-white/50">
                                        {propertyCount === 1 ? 'Property' : 'Properties'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroSub;
