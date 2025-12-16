import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import PropertySubmissionsTable from "@/components/shared/dashboard/property-submissions-table";

export const metadata: Metadata = {
  title: "Property Submissions | Dashboard",
  description: "Review and manage property owner submissions.",
};

async function getSubmissions() {
  const submissions = await prisma.propertySubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
  return submissions;
}

export default async function PropertySubmissionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has dashboard access (AGENT or admin)
  const allowedRoles = ["AGENT", "ADMIN"];
  if (!allowedRoles.includes(session.user.role || "")) {
    redirect("/dashboard");
  }

  const submissions = await getSubmissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Property Submissions
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Review and manage property listings from owners.
        </p>
      </div>

      <PropertySubmissionsTable data={submissions} />
    </div>
  );
}

