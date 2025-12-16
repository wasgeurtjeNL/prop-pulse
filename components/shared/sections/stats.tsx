const STATS = [
  { label: "Properties Managed", value: "500+" },
  { label: "International Clients", value: "1,200+" },
  { label: "Client Satisfaction", value: "98%" },
];

const Stats = () => {
  return (
    <section className="border-b bg-background py-10">
      <div className="container mx-auto flex flex-col items-center justify-around gap-8 px-4 sm:flex-row md:gap-16 sm:px-6 lg:px-8">
        {STATS.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-primary md:text-4xl">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
