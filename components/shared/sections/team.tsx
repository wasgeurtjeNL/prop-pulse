import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

const TEAM_MEMBERS = [
  {
    name: "Sarah Jenkins",
    role: "Founder & CEO",
    bio: "15+ years in Thai luxury real estate. Expert in expat property services across Phuket & Pattaya.",
    image: "/sarah-jenkins.avif",
  },
  {
    name: "David Chen",
    role: "Sales Director",
    bio: "Specialist in international property investment. Fluent in English, Chinese & Thai.",
    image: "/david-chen.avif",
  },
  {
    name: "Elena Rodriguez",
    role: "Client Relations Manager",
    bio: "Dedicated to providing seamless service for our international clients and investors.",
    image: "/elena-rodriguez.avif",
  },
  {
    name: "Marcus Johnson",
    role: "Property Management Director",
    bio: "Overseeing maintenance and rental operations across our entire Phuket & Pattaya portfolio.",
    image: "/marcus-johnson.avif",
  },
];

const Team = () => {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Meet Our Leadership Team
          </h2>
          <p className="text-muted-foreground">
            Experienced professionals dedicated to excellence in Thailand's luxury real estate market.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM_MEMBERS.map((member, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-md">
              <div className="aspect-[4/5] relative">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <CardDescription className="text-primary font-medium">
                  {member.role}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
