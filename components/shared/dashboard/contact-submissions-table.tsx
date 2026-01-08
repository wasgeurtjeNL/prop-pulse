"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  inquiryType: string;
  message: string;
  status: string;
  notes: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export default function ContactSubmissionsTable() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inquiryFilter, setInquiryFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const fetchSubmissions = async () => {
    try {
      let url = "/api/contact?";
      if (statusFilter !== "all") url += `status=${statusFilter}&`;
      if (inquiryFilter !== "all") url += `inquiryType=${inquiryFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      toast.error("Failed to load contact submissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, inquiryFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      SPAM: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getInquiryLabel = (type: string) => {
    const labels: Record<string, string> = {
      buy: "Buying Property",
      rent: "Renting Property",
      sell: "Selling Home",
      agent: "Join as Agent",
      other: "Other Inquiry",
    };
    return labels[type] || type;
  };

  const getInquiryIcon = (type: string) => {
    const icons: Record<string, string> = {
      buy: "lucide:home",
      rent: "lucide:key",
      sell: "lucide:tag",
      agent: "lucide:user-plus",
      other: "lucide:help-circle",
    };
    return icons[type] || "lucide:mail";
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingStatus(id);
    try {
      const response = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        fetchSubmissions();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateNotes = async () => {
    if (!selectedSubmission) return;
    
    try {
      const response = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSubmission.id, notes }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notes saved");
        fetchSubmissions();
      } else {
        toast.error(data.error || "Failed to save notes");
      }
    } catch (error) {
      toast.error("Failed to save notes");
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    
    try {
      const response = await fetch(`/api/contact?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Submission deleted");
        fetchSubmissions();
        setIsDetailsOpen(false);
      } else {
        toast.error(data.error || "Failed to delete submission");
      }
    } catch (error) {
      toast.error("Failed to delete submission");
    }
  };

  const openDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setNotes(submission.notes || "");
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="SPAM">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Inquiry:</Label>
          <Select value={inquiryFilter} onValueChange={setInquiryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by inquiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buying Property</SelectItem>
              <SelectItem value="rent">Renting Property</SelectItem>
              <SelectItem value="sell">Selling Home</SelectItem>
              <SelectItem value="agent">Join as Agent</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon icon="lucide:inbox" className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No contact submissions found</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
          <Table className="min-w-[600px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="hidden md:table-cell">Inquiry Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow 
                  key={submission.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetails(submission)}
                >
                  <TableCell>
                    <div className="font-medium">
                      {submission.firstName} {submission.lastName}
                    </div>
                    {submission.utmSource && (
                      <div className="text-xs text-muted-foreground">
                        via {submission.utmSource}
                        {submission.utmCampaign && ` / ${submission.utmCampaign}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="text-sm">{submission.email}</div>
                    {submission.phone && (
                      <div className="text-xs text-muted-foreground">{submission.phone}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Icon icon={getInquiryIcon(submission.inquiryType)} className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getInquiryLabel(submission.inquiryType)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {format(new Date(submission.createdAt), "MMM d, yyyy")}
                    <div className="text-xs">
                      {format(new Date(submission.createdAt), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" disabled={updatingStatus === submission.id}>
                          {updatingStatus === submission.id ? (
                            <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                          ) : (
                            <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(submission.id, "NEW")}>
                          <Icon icon="lucide:inbox" className="mr-2 h-4 w-4 text-blue-500" />
                          Mark as New
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(submission.id, "CONTACTED")}>
                          <Icon icon="lucide:phone-outgoing" className="mr-2 h-4 w-4 text-yellow-500" />
                          Mark as Contacted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(submission.id, "IN_PROGRESS")}>
                          <Icon icon="lucide:clock" className="mr-2 h-4 w-4 text-purple-500" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(submission.id, "RESOLVED")}>
                          <Icon icon="lucide:check-circle" className="mr-2 h-4 w-4 text-green-500" />
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(submission.id, "SPAM")} className="text-red-600">
                          <Icon icon="lucide:trash-2" className="mr-2 h-4 w-4" />
                          Mark as Spam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon={getInquiryIcon(selectedSubmission?.inquiryType || "")} className="h-5 w-5" />
              Contact Submission Details
            </DialogTitle>
            <DialogDescription>
              Received on {selectedSubmission && format(new Date(selectedSubmission.createdAt), "MMMM d, yyyy 'at' HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedSubmission.firstName} {selectedSubmission.lastName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm">
                    <a href={`mailto:${selectedSubmission.email}`} className="text-primary hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm">
                    {selectedSubmission.phone ? (
                      <a href={`tel:${selectedSubmission.phone}`} className="text-primary hover:underline">
                        {selectedSubmission.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Inquiry Type */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Inquiry Type</Label>
                <div className="flex items-center gap-2">
                  <Icon icon={getInquiryIcon(selectedSubmission.inquiryType)} className="h-4 w-4 text-muted-foreground" />
                  <span>{getInquiryLabel(selectedSubmission.inquiryType)}</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              {/* UTM Info */}
              {(selectedSubmission.utmSource || selectedSubmission.utmMedium || selectedSubmission.utmCampaign) && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Traffic Source</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.utmSource && (
                      <Badge variant="outline">Source: {selectedSubmission.utmSource}</Badge>
                    )}
                    {selectedSubmission.utmMedium && (
                      <Badge variant="outline">Medium: {selectedSubmission.utmMedium}</Badge>
                    )}
                    {selectedSubmission.utmCampaign && (
                      <Badge variant="outline">Campaign: {selectedSubmission.utmCampaign}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs text-muted-foreground">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this submission..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button size="sm" variant="outline" onClick={updateNotes}>
                  <Icon icon="lucide:save" className="mr-2 h-4 w-4" />
                  Save Notes
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`mailto:${selectedSubmission.email}`, "_blank")}
                >
                  <Icon icon="lucide:mail" className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                {selectedSubmission.phone && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${selectedSubmission.phone}`, "_blank")}
                    >
                      <Icon icon="lucide:phone" className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${selectedSubmission.phone?.replace(/[^0-9]/g, "")}`, "_blank")}
                    >
                      <Icon icon="logos:whatsapp-icon" className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => deleteSubmission(selectedSubmission.id)}
                >
                  <Icon icon="lucide:trash-2" className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
