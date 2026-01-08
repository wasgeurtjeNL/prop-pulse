import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import StatsContactSubmissions from "@/components/shared/dashboard/stats-contact-submissions";
import ContactSubmissionsTable from "@/components/shared/dashboard/contact-submissions-table";

export default function ContactSubmissionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contact Submissions</h2>
          <p className="text-muted-foreground">
            View and manage all contact form submissions from your website
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsContactSubmissions />

      {/* Contact Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contact Submissions</CardTitle>
          <CardDescription>
            View messages from visitors, track their status, and respond to inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactSubmissionsTable />
        </CardContent>
      </Card>
    </div>
  );
}
