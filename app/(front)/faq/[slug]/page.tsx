import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { LandingPageSections } from "@/components/new-design/landing-page/LandingPageSections";
import { generateFAQSchema, renderJsonLd } from "@/lib/utils/structured-data";
import Breadcrumb from "@/components/new-design/breadcrumb";
import AdminEditButton from "@/components/shared/admin-edit-button";

export const dynamicParams = true;
export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const url = `/faq/${slug}`;
  const page = await prisma.landingPage.findUnique({ where: { url } });

  if (!page || !page.published) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    ...(baseUrl && {
      alternates: { canonical: `${baseUrl}${page.url}` },
    }),
  };
}

export default async function FaqLandingPage({ params }: Props) {
  const { slug } = await params;
  const url = `/faq/${slug}`;
  const page = await prisma.landingPage.findUnique({ where: { url } });

  if (!page || !page.published) notFound();

  const faq = Array.isArray(page.faq) ? (page.faq as Array<{ question: string; answer: string }>) : null;

  const breadcrumbs = [
    { name: 'FAQ', href: '/faq' },
    { name: page.title, href: `/faq/${slug}` }
  ];

  return (
    <>
      {faq && faq.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={renderJsonLd(generateFAQSchema(faq))} />
      )}
      <main className="container max-w-6xl mx-auto px-5 2xl:px-0 pt-20 lg:pt-24 pb-16">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
        
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-dark dark:text-white md:text-5xl text-3xl leading-[1.2] font-bold">
            {page.title}
          </h1>
          {page.metaDescription && (
            <p className="text-lg mt-4 text-dark/70 dark:text-white/70 max-w-3xl">
              {page.metaDescription}
            </p>
          )}
        </header>

        {/* Content with alternating image/text sections */}
        <LandingPageSections content={page.content} className="mt-10" />

        {/* FAQ Section */}
        {faq && faq.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faq.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">
                    {item.question}
                  </h3>
                  <div 
                    className="text-dark/70 dark:text-white/70 prose prose-a:text-primary prose-a:underline prose-a:hover:text-primary/80"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      
      {/* Admin Edit Button */}
      <AdminEditButton editType="page" editId={page.id} pageUrl={page.url} />
    </>
  );
}
