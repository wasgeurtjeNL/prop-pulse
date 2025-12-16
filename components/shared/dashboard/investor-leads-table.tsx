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
import { format } from "date-fns";
import { toast } from "sonner";

interface InvestorLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  currency: string;
  investmentBudget: string;
  investmentGoal: string;
  timeline: string;
  preferredAreas: string | null;
  propertyType: string | null;
  experience: string | null;
  financing: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

export default function InvestorLeadsTable() {
  const [leads, setLeads] = useState<InvestorLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<InvestorLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      const url = filter === "all" 
        ? "/api/investor-lead"
        : `/api/investor-lead?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      QUALIFIED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      PROPOSAL_SENT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      CONVERTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      NOT_INTERESTED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      LOST: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
      <Badge className={variants[status] || variants.NEW}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getBudgetLabel = (budget: string, currency: string) => {
    const currencySymbols: Record<string, string> = {
      EUR: "€",
      USD: "$",
      GBP: "£",
      THB: "฿",
      AUD: "A$",
    };
    
    const symbol = currencySymbols[currency] || currency;
    const ranges: Record<string, string> = {
      "50k-200k": `${symbol}50k-200k`,
      "200k-500k": `${symbol}200k-500k`,
      "500k-1m": `${symbol}500k-1m`,
      "1m+": `${symbol}1M+`,
    };
    
    return ranges[budget] || budget;
  };

  const getGoalIcon = (goal: string) => {
    const icons: Record<string, string> = {
      "buy-hold": "ph:house-bold",
      "fix-flip": "ph:hammer-bold",
      "rental-income": "ph:currency-dollar-bold",
      "vacation-home": "ph:sun-horizon-bold",
      "diversification": "ph:chart-line-up-bold",
    };
    
    return icons[goal] || "ph:star-bold";
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId);
    try {
      const response = await fetch(`/api/investor-lead/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Status updated successfully');
        // Update local state
        setLeads(leads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
        // Refresh leads to get updated data
        fetchLeads();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/investor-lead/${leadId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Lead deleted successfully');
        fetchLeads();
      } else {
        toast.error('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const viewLeadDetails = (lead: InvestorLead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon icon="ph:circle-notch" className="animate-spin text-primary" width={32} height={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({leads.length})
        </Button>
        <Button
          variant={filter === "NEW" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("NEW")}
        >
          New
        </Button>
        <Button
          variant={filter === "CONTACTED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("CONTACTED")}
        >
          Contacted
        </Button>
        <Button
          variant={filter === "QUALIFIED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("QUALIFIED")}
        >
          Qualified
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Areas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No investor leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                      <span className="text-xs text-muted-foreground">{lead.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {getBudgetLabel(lead.investmentBudget, lead.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon icon={getGoalIcon(lead.investmentGoal)} className="text-primary" width={20} height={20} />
                      <span className="text-sm capitalize">
                        {lead.investmentGoal.replace(/-/g, " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{lead.timeline.replace(/-/g, " ")}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{lead.preferredAreas || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => updateLeadStatus(lead.id, value)}
                      disabled={updatingStatus === lead.id}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            New
                          </span>
                        </SelectItem>
                        <SelectItem value="CONTACTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Contacted
                          </span>
                        </SelectItem>
                        <SelectItem value="QUALIFIED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Qualified
                          </span>
                        </SelectItem>
                        <SelectItem value="PROPOSAL_SENT">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Proposal Sent
                          </span>
                        </SelectItem>
                        <SelectItem value="CONVERTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Converted
                          </span>
                        </SelectItem>
                        <SelectItem value="NOT_INTERESTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            Not Interested
                          </span>
                        </SelectItem>
                        <SelectItem value="LOST">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Lost
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Icon icon="ph:dots-three-vertical-bold" width={20} height={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => viewLeadDetails(lead)}>
                          <Icon icon="ph:eye-bold" className="mr-2" width={16} height={16} />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${lead.email}`}>
                          <Icon icon="ph:envelope-bold" className="mr-2" width={16} height={16} />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `tel:${lead.countryCode}${lead.phone}`}>
                          <Icon icon="ph:phone-bold" className="mr-2" width={16} height={16} />
                          Call
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Icon icon="ph:trash-bold" className="mr-2" width={16} height={16} />
                          Delete Lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Investor Lead Details</DialogTitle>
            <DialogDescription>
              Complete information about this investment inquiry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Icon icon="ph:user-bold" className="text-primary" width={20} height={20} />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedLead.countryCode} {selectedLead.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                  </div>
                </div>
              </div>

              {/* Investment Profile */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Icon icon="ph:chart-line-up-bold" className="text-primary" width={20} height={20} />
                  Investment Profile
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Investment Budget</p>
                    <p className="font-medium text-green-600">{getBudgetLabel(selectedLead.investmentBudget, selectedLead.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Investment Goal</p>
                    <p className="font-medium capitalize">{selectedLead.investmentGoal.replace(/-/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timeline</p>
                    <p className="font-medium capitalize">{selectedLead.timeline.replace(/-/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Property Type</p>
                    <p className="font-medium capitalize">{selectedLead.propertyType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Areas</p>
                    <p className="font-medium">{selectedLead.preferredAreas || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium capitalize">{selectedLead.experience?.replace(/-/g, ' ') || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Financing</p>
                    <p className="font-medium capitalize">{selectedLead.financing || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {selectedLead.message && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Icon icon="ph:note-bold" className="text-primary" width={20} height={20} />
                    Additional Information
                  </h3>
                  <div className="pl-7">
                    <p className="text-sm bg-muted p-3 rounded-md">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {/* Submission Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Icon icon="ph:info-bold" className="text-primary" width={20} height={20} />
                  Submission Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted On</p>
                    <p className="font-medium">{format(new Date(selectedLead.createdAt), "PPP 'at' p")}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => window.location.href = `mailto:${selectedLead.email}`}
                  className="flex-1"
                >
                  <Icon icon="ph:envelope-bold" className="mr-2" width={18} height={18} />
                  Send Email
                </Button>
                <Button 
                  onClick={() => window.location.href = `tel:${selectedLead.countryCode}${selectedLead.phone}`}
                  variant="outline"
                  className="flex-1"
                >
                  <Icon icon="ph:phone-bold" className="mr-2" width={18} height={18} />
                  Call
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

