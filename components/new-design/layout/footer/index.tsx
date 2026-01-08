"use client";
import Link from "next/link";
import { Icon } from "@iconify/react"
import { useLayoutData } from "@/lib/contexts/layout-data-context";
import { useState } from "react";
import { toast } from "sonner";
import { klaviyoSubscribe } from "@/lib/klaviyo-tracking";

const Footer = () => {
  const { data: layoutData } = useLayoutData();
  const footerLinks = layoutData?.footerLinks ?? null;
  
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Klaviyo Browser API (primary method - no server round-trip needed)
      const success = await klaviyoSubscribe(email, 'Footer Newsletter');
      
      if (success) {
        toast.success('Successfully subscribed to our newsletter!');
        setEmail(''); // Clear the input
      } else {
        // Fallback to server API if browser API fails
        const response = await fetch('/api/klaviyo/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(data.message || 'Successfully subscribed to our newsletter!');
          setEmail('');
        } else {
          toast.error(data.error || 'Failed to subscribe. Please try again.');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative z-10 bg-dark mb-0 pb-0">
      <div className="container mx-auto max-w-8xl pt-14 px-4 sm:px-6 lg:px-0">
        <div className="flex lg:items-center justify-between items-end lg:gap-11 pb-14 border-b border-white/10 lg:flex-nowrap flex-wrap gap-6">
          <p className="text-white text-sm lg:max-w-1/5">
            Stay updated with new property listings,
            market insights, and exclusive investment opportunities in Phuket & Pattaya.
          </p>
          <div className="flex lg:flex-row flex-col items-center lg:gap-10 gap-3 w-full lg:w-auto">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 lg:order-1 order-2 w-full lg:w-auto">
              <input 
                type="email" 
                placeholder="Enter Your Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="rounded-full py-4 px-6 bg-white/10 placeholder:text-white text-white focus-visible:outline-0 w-full sm:w-auto min-w-0 sm:flex-1 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="text-dark bg-white py-4 px-8 font-semibold rounded-full hover:bg-primary hover:text-white duration-300 hover:cursor-pointer whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            <p className="text-white/40 text-sm lg:max-w-[45%] order-1 lg:order-2 text-center lg:text-left">
              By subscribing, you agree to receive our promotional emails. You can unsubscribe at any time.
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
                {/* Free Tools - Always visible */}
                <div>
                  <Link href="/tools" prefetch={false} className="text-white/40 text-xm hover:text-white flex items-center gap-1.5">
                    <Icon icon="solar:calculator-bold" width={14} height={14} />
                    Free Tools
                  </Link>
                </div>
                {/* For Property Owners - Highlighted */}
                <div>
                  <Link href="/for-owners" prefetch={false} className="text-emerald-400 hover:text-emerald-300 text-xm flex items-center gap-1.5 font-medium">
                    <Icon icon="ph:crown-simple-fill" width={14} height={14} />
                    For Property Owners
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Owner Portal Banner */}
        <div className="py-6 border-b border-white/10">
          <Link 
            href="/for-owners" 
            prefetch={false}
            className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-700/30 hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <Icon icon="ph:crown-simple-fill" className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Are you a property owner?</p>
                <p className="text-white/60 text-sm">Discover our Owner Portal with real-time statistics, verified offers & more</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <span className="text-sm font-medium">Learn More</span>
              <Icon icon="ph:arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
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