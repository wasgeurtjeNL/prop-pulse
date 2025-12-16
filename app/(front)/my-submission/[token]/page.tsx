import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import SubmissionDetail from "@/components/new-design/list-property/submission-detail";

export const metadata: Metadata = {
  title: "Your Property Submission | PSM Phuket",
  description: "Track the status of your property listing submission.",
};

interface Props {
  params: Promise<{ token: string }>;
}

async function getSubmission(token: string) {
  const submission = await prisma.propertySubmission.findUnique({
    where: { accessToken: token },
  });
  return submission;
}

export default async function SubmissionPage({ params }: Props) {
  const { token } = await params;
  const submission = await getSubmission(token);

  if (!submission) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <SubmissionDetail submission={submission} />
    </main>
  );
}



