import { Metadata } from "next";
import BookingsTable from "@/components/shared/dashboard/bookings-table";

export const metadata: Metadata = {
  title: "Rental Bookings | Dashboard",
  description: "Manage rental bookings and reservations",
};

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rental Bookings</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all rental reservations. Confirm or reject pending bookings and communicate with guests.
        </p>
      </div>
      
      <BookingsTable />
    </div>
  );
}





