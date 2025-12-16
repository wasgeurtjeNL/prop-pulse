import { Configuration } from "@/components/new-design/documentation/Configuration";
import { DocNavigation } from "@/components/new-design/documentation/DocNavigation";
import { Introduction } from "@/components/new-design/documentation/Introduction";
import { PackageStructure } from "@/components/new-design/documentation/PackageStructure";
import { QuickStart } from "@/components/new-design/documentation/QuickStart";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Documentation | Real Estate Pulse",
};

export default function DocumentationPage() {
    return (
        <div className="">
            <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md p-6 lg:mt-28 mt-16 !pt-10">
                <div className="grid grid-cols-12 gap-6">
                    <div className="lg:col-span-3 col-span-12 lg:block hidden">
                        <DocNavigation />
                    </div>
                    <div className="lg:col-span-9 col-span-12">
                        <Introduction />
                        <PackageStructure />
                        <QuickStart />
                        <Configuration />
                    </div>
                </div>
            </div>
        </div>
    );
}
