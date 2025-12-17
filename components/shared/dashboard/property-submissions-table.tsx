"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Eye, Check, X, Clock, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PropertySubmission {
  id: string;
  accessToken: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyTitle: string;
  propertyCategory: string;
  propertyType: string;
  location: string;
  askingPrice: string;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  images: string[];
  exclusiveRights: boolean;
  commissionRate: number;
  status: string;
  reviewNotes: string | null;
  createdAt: Date;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_REVIEW: { label: "Pending Review", variant: "secondary" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  INFO_REQUESTED: { label: "Info Requested", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  IMAGES_UPLOADED: { label: "Images Uploaded", variant: "default" },
  READY_TO_PUBLISH: { label: "Ready to Publish", variant: "default" },
  PUBLISHED: { label: "Published", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const categoryLabels: Record<string, string> = {
  LUXURY_VILLA: "Luxury Villa",
  APARTMENT: "Apartment",
  RESIDENTIAL_HOME: "Residential",
  OFFICE_SPACES: "Commercial",
};

export default function PropertySubmissionsTable({ data }: { data: PropertySubmission[] }) {
  const [submissions, setSubmissions] = useState(data);
  const [selectedSubmission, setSelectedSubmission] = useState<PropertySubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "request_info" | "publish" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const openDialog = (submission: PropertySubmission, action: "approve" | "reject" | "request_info" | "publish") => {
    setSelectedSubmission(submission);
    setDialogAction(action);
    setReviewNotes(submission.reviewNotes || "");
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedSubmission || !dialogAction) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: dialogAction,
          reviewNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to update submission");

      const updatedSubmission = await response.json();
      
      // Update local state
      setSubmissions(submissions.map(s => 
        s.id === selectedSubmission.id ? { ...s, ...updatedSubmission.submission } : s
      ));

      toast.success(
        dialogAction === "approve" ? "Submission approved! Owner can now upload images." :
        dialogAction === "reject" ? "Submission rejected." :
        dialogAction === "request_info" ? "Information request sent to owner." :
        "Property published successfully!"
      );

      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update submission. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDialogConfig = () => {
    switch (dialogAction) {
      case "approve":
        return {
          title: "Approve Submission",
          description: "Approve this submission so the owner can upload property images. You can add optional notes for the owner.",
          buttonText: "Approve",
          buttonClass: "bg-green-600 hover:bg-green-700",
        };
      case "reject":
        return {
          title: "Reject Submission",
          description: "Reject this submission. Please provide a reason for the rejection.",
          buttonText: "Reject",
          buttonClass: "bg-red-600 hover:bg-red-700",
        };
      case "request_info":
        return {
          title: "Request More Information",
          description: "Request additional information from the property owner. Be specific about what you need.",
          buttonText: "Send Request",
          buttonClass: "bg-orange-600 hover:bg-orange-700",
        };
      case "publish":
        return {
          title: "Publish Listing",
          description: "Publish this property listing to the website. This will make it visible to all visitors.",
          buttonText: "Publish",
          buttonClass: "bg-primary hover:bg-primary/90",
        };
      default:
        return { title: "", description: "", buttonText: "", buttonClass: "" };
    }
  };

  const dialogConfig = getDialogConfig();

  return (
    <>
      <div className="rounded-md border bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="font-medium line-clamp-1">{submission.propertyTitle}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {submission.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{submission.ownerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {categoryLabels[submission.propertyCategory]}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {submission.propertyType === "FOR_SALE" ? "For Sale" : "For Rent"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.exclusiveRights ? (
                      <Badge variant="default" className="bg-primary">
                        Exclusive {submission.commissionRate}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Standard {submission.commissionRate}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[submission.status]?.variant || "secondary"}>
                      {statusConfig[submission.status]?.label || submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/my-submission/${submission.accessToken}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {submission.status === "PENDING_REVIEW" && (
                          <>
                            <DropdownMenuItem onClick={() => openDialog(submission, "approve")}>
                              <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog(submission, "request_info")}>
                              <Clock className="mr-2 h-4 w-4 text-orange-600" /> Request Info
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog(submission, "reject")}>
                              <X className="mr-2 h-4 w-4 text-red-600" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}

                        {submission.status === "IMAGES_UPLOADED" && (
                          <>
                            <DropdownMenuItem onClick={() => openDialog(submission, "publish")}>
                              <Send className="mr-2 h-4 w-4 text-primary" /> Publish Listing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog(submission, "request_info")}>
                              <Clock className="mr-2 h-4 w-4 text-orange-600" /> Request Better Images
                            </DropdownMenuItem>
                          </>
                        )}

                        {submission.status === "READY_TO_PUBLISH" && (
                          <DropdownMenuItem onClick={() => openDialog(submission, "publish")}>
                            <Send className="mr-2 h-4 w-4 text-primary" /> Publish Listing
                          </DropdownMenuItem>
                        )}

                        {submission.status === "INFO_REQUESTED" && (
                          <>
                            <DropdownMenuItem onClick={() => openDialog(submission, "approve")}>
                              <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog(submission, "reject")}>
                              <X className="mr-2 h-4 w-4 text-red-600" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogConfig.title}</DialogTitle>
            <DialogDescription>{dialogConfig.description}</DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="font-medium">{selectedSubmission.propertyTitle}</p>
                <p className="text-sm text-muted-foreground">by {selectedSubmission.ownerName}</p>
              </div>

              {(dialogAction === "reject" || dialogAction === "request_info" || dialogAction === "approve") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {dialogAction === "approve" ? "Notes for Owner (Optional)" : "Message to Owner"}
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      dialogAction === "reject" 
                        ? "Please explain why this submission was rejected..."
                        : dialogAction === "request_info"
                        ? "Please specify what additional information you need..."
                        : "Any notes for the owner about the next steps..."
                    }
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading || (dialogAction === "reject" && !reviewNotes) || (dialogAction === "request_info" && !reviewNotes)}
              className={dialogConfig.buttonClass}
            >
              {loading ? "Processing..." : dialogConfig.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





