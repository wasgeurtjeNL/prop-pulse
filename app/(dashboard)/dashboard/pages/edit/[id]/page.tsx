import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LandingPageEditForm from "@/components/shared/dashboard/landing-page-edit-form";

interface EditLandingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLandingPage({ params }: EditLandingPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const { id } = await params;

  const page = await prisma.landingPage.findUnique({
    where: { id },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Landing Page</h2>
        <p className="text-muted-foreground mt-1">{page.url}</p>
      </div>

      {/* Form */}
      <LandingPageEditForm page={page} />
    </div>
  );
}

