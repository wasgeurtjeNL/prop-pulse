import { CheckCircle2, Globe, Trophy, Users } from "lucide-react";
import Image from "next/image";

const Mission = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              Your Trusted Property Partner in Thailand
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              At PSM Phuket, we specialize in premium property management and real estate 
              services across Thailand's most sought-after coastal destinations. From luxury beachfront 
              villas with Andaman Sea views in Phuket to modern high-rise condominiums in vibrant Pattaya, 
              we help international clients and investors navigate Thai real estate with confidence - finding 
              their perfect tropical retreat or maximizing returns on investment properties.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {[
                {
                  icon: Trophy,
                  title: "Local Market Expertise",
                  desc: "15+ years experience in Phuket & Pattaya real estate markets.",
                },
                {
                  icon: Users,
                  title: "Expat-Focused Service",
                  desc: "Multilingual team specializing in international client needs.",
                },
                {
                  icon: Globe,
                  title: "Complete Property Management",
                  desc: "End-to-end services: sales, rentals, maintenance & legal support.",
                },
                {
                  icon: CheckCircle2,
                  title: "Investment Excellence",
                  desc: "Proven track record of high-ROI properties and expert guidance.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
            <Image
              src="/team-meeting.avif"
              alt="Team Meeting"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;
