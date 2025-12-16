import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const Values = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto grid gap-12 px-4 sm:px-6 lg:px-8 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-square overflow-hidden rounded-2xl lg:aspect-auto lg:h-[600px]">
          <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop"
          alt="Luxury Pool Villa Thailand"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Why Choose PSM Phuket?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            {
              "We don't just manage properties; we create exceptional living experiences in Thailand's most beautiful locations. Our comprehensive services ensure your investment thrives and your property remains pristine."
            }
          </p>
          <ul className="space-y-4">
            {[
              "Exclusive luxury villas & beachfront properties",
              "Professional property management & rental services",
              "Expert legal & investment consultation for foreigners",
              "24/7 multilingual customer support",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button size="lg">Explore Properties</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;
