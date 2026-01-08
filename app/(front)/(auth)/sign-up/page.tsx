import SignUp from "@/components/new-design/auth/sign-up";
import { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "Sign Up | Create Your Account | PSM Phuket",
  description: "Create an account to access your own dashboard with real-time property insights, receive verified offers, and manage your properties efficiently.",
};

const benefits = [
  {
    icon: "ph:chart-line-up",
    title: "Real-time Statistics",
    description: "See live who views your property and where they come from"
  },
  {
    icon: "ph:gavel",
    title: "Verified Offers",
    description: "Only passport-verified buyers can place offers"
  },
  {
    icon: "ph:shield-check",
    title: "TM30 Automation",
    description: "Fully automated immigration reporting for rentals"
  },
  {
    icon: "ph:currency-circle-dollar",
    title: "Transparent Pricing",
    description: "No hidden fees, pay only on success"
  },
  {
    icon: "ph:rocket-launch",
    title: "7 Months Faster",
    description: "Sell your property faster with our marketing platform"
  },
];

const SignUpPage = () => {
  return (
    <section className="pt-20 sm:pt-24 lg:pt-28 pb-12 min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-6xl mx-auto">
          {/* Left: Benefits Section */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6">
                <Icon icon="ph:crown-simple-fill" className="w-4 h-4" />
                <span className="text-sm font-medium">Enterprise Platform for Owners</span>
              </span>
              
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                More than just a{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  listing
                </span>
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Get your own dashboard with real-time insights, verified offers, and automated processes. Like Airbnb for hosts, but for real estate.
              </p>
              
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                      <Icon icon={benefit.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-2">
                  <Icon icon="ph:info" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-800 dark:text-emerald-200">Want to learn more?</span>
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                  Discover all the features of our Owner Portal and see how we can help you sell faster.
                </p>
                <Link 
                  href="/for-owners" 
                  className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium hover:underline text-sm"
                >
                  <span>Explore Owner Portal</span>
                  <Icon icon="ph:arrow-right" className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right: Form */}
          <div>
            {/* Mobile-only benefits summary */}
            <div className="lg:hidden mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Icon icon="ph:crown-simple-fill" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                    Why create an account?
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Get your own dashboard, receive verified offers, and sell 7 months faster with our enterprise platform.
                  </p>
                  <Link 
                    href="/for-owners" 
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm mt-2 hover:underline"
                  >
                    Learn more <Icon icon="ph:arrow-right" className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="p-8 sm:p-12 rounded-2xl shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Your Account</h1>
                <p className="text-slate-600 dark:text-slate-400">Join thousands of property owners</p>
              </div>
              <SignUp />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpPage;
