import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import OwnerPortalContent from "@/components/owner-portal/owner-portal-content";

export const metadata: Metadata = {
  title: "Eigenaar Portal | PSM Phuket",
  description: "Beheer uw woningen - pas prijzen aan en markeer verkochte woningen",
};

export default async function OwnerPortalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to sign-in if not logged in
  if (!session || !session.user) {
    redirect("/sign-in?callbackUrl=/owner-portal");
  }

  // Only owners can access this page
  if (session.user.role !== "OWNER") {
    return (
      <section className="pt-20 sm:pt-24 lg:pt-28 min-h-screen">
        <div className="container mx-auto max-w-2xl py-12 px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Toegang Geweigerd</h1>
            <p className="text-muted-foreground mb-6">
              Deze pagina is alleen toegankelijk voor geregistreerde woningeigenaren.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Heeft u een uitnodigingscode ontvangen? Registreer dan eerst uw account.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up/owner"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Registreren als Eigenaar
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border rounded-lg hover:bg-muted transition"
              >
                Terug naar Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Log the session for owner
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/owner-portal/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: (await headers()).get("cookie") || "",
      },
      body: JSON.stringify({ action: "LOGIN" }),
    });
  } catch (error) {
    console.error("Failed to log owner session:", error);
  }

  return (
    <section className="pt-20 sm:pt-24 lg:pt-28 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto py-8 px-4">
        <OwnerPortalContent user={session.user} />
      </div>
    </section>
  );
}
