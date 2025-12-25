"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  User,
  Phone,
  CreditCard,
  Home,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";

interface OwnerDocument {
  id: string;
  documentType: "ID_CARD" | "BLUEBOOK" | "PASSPORT" | "BUSINESS_REG" | "OTHER";
  imageUrl: string;
  imagePath: string;
  houseId?: string;
  propertyId?: string;
  isVerified: boolean;
  createdAt: string;
}

interface OwnerProperty {
  id: string;
  title: string;
  location: string;
  tm30AccommodationId?: string;
  tm30AccommodationName?: string;
  bluebookUrl?: string;
  bluebookHouseId?: string;
}

interface PropertyOwner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  thaiIdNumber?: string;
  gender?: string;
  idCardUrl?: string;
  idCardVerified: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  documents: OwnerDocument[];
  properties: OwnerProperty[];
  _count?: {
    properties: number;
    documents: number;
    tm30Requests: number;
  };
}

export function PropertyOwnersTable() {
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<PropertyOwner | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async (searchTerm?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      
      const response = await fetch(`/api/owners?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setOwners(data.owners || []);
      } else {
        toast.error(data.error || "Failed to fetch owners");
      }
    } catch (error) {
      toast.error("Failed to fetch owners");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOwners(search);
  };

  const toggleExpand = (ownerId: string) => {
    setExpandedOwner(expandedOwner === ownerId ? null : ownerId);
  };

  const openDetail = (owner: PropertyOwner) => {
    setSelectedOwner(owner);
    setDetailDialogOpen(true);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "ID_CARD":
        return <CreditCard className="h-4 w-4" />;
      case "BLUEBOOK":
        return <FileText className="h-4 w-4" />;
      case "PASSPORT":
        return <FileText className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const hasIdCard = (owner: PropertyOwner) => {
    return owner.idCardUrl || owner.documents.some(d => d.documentType === "ID_CARD");
  };

  const getBluebookCount = (owner: PropertyOwner) => {
    return owner.documents.filter(d => d.documentType === "BLUEBOOK").length;
  };

  if (loading && owners.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, telefoon, of Thai ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zoeken"}
        </Button>
      </div>

      {/* Owners List */}
      {owners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Geen eigenaren gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {owners.map((owner) => (
            <Card key={owner.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                onClick={() => toggleExpand(owner.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {owner.firstName} {owner.lastName}
                        {owner.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Geverifieerd
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {owner.phone}
                        </span>
                        {owner.thaiIdNumber && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> {owner.thaiIdNumber.slice(0, 5)}...
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Document Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={hasIdCard(owner) ? "default" : "outline"} className="text-xs">
                        ID {hasIdCard(owner) ? "✓" : "✗"}
                      </Badge>
                      <Badge variant={getBluebookCount(owner) > 0 ? "default" : "outline"} className="text-xs">
                        BB: {getBluebookCount(owner)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Home className="h-3 w-3 mr-1" /> {owner.properties?.length || 0}
                      </Badge>
                    </div>
                    
                    {expandedOwner === owner.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandedOwner === owner.id && (
                <CardContent className="border-t pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Documents Section */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Documenten
                      </h4>
                      <div className="space-y-2">
                        {/* ID Card */}
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">ID Kaart</span>
                          </div>
                          {hasIdCard(owner) ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              {owner.idCardUrl && (
                                <a 
                                  href={owner.idCardUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  Bekijk
                                </a>
                              )}
                            </div>
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Bluebooks */}
                        {owner.documents
                          .filter(d => d.documentType === "BLUEBOOK")
                          .map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Bluebook {doc.houseId && `(${doc.houseId})`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.isVerified ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <span className="text-xs text-muted-foreground">Niet geverifieerd</span>
                                )}
                                <a 
                                  href={doc.imageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  Bekijk
                                </a>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    {/* Properties Section */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Home className="h-4 w-4" /> Woningen ({owner.properties?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {owner.properties?.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-2">Geen woningen gekoppeld</p>
                        ) : (
                          owner.properties?.map((property) => (
                            <div key={property.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{property.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{property.location}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {property.tm30AccommodationId ? (
                                  <Badge variant="default" className="text-xs">TM30 ✓</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">TM30 ✗</Badge>
                                )}
                                {property.bluebookHouseId && (
                                  <Badge variant="secondary" className="text-xs">
                                    BB: {property.bluebookHouseId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => openDetail(owner)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Volledig Profiel
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Owner Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedOwner?.firstName} {selectedOwner?.lastName}
            </DialogTitle>
            <DialogDescription>
              Eigenaar profiel en gekoppelde documenten
            </DialogDescription>
          </DialogHeader>
          
          {selectedOwner && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefoon</label>
                  <p className="mt-1">{selectedOwner.phone}</p>
                </div>
                {selectedOwner.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">{selectedOwner.email}</p>
                  </div>
                )}
                {selectedOwner.thaiIdNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thai ID</label>
                    <p className="mt-1 font-mono">{selectedOwner.thaiIdNumber}</p>
                  </div>
                )}
                {selectedOwner.gender && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Geslacht</label>
                    <p className="mt-1">{selectedOwner.gender === "Male" ? "Man" : "Vrouw"}</p>
                  </div>
                )}
              </div>

              {/* ID Card Preview */}
              {selectedOwner.idCardUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Kaart</label>
                  <div className="mt-2 rounded-lg border overflow-hidden">
                    <img 
                      src={selectedOwner.idCardUrl} 
                      alt="ID Card" 
                      className="w-full max-h-48 object-contain bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Properties List */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Gekoppelde Woningen ({selectedOwner.properties?.length || 0})
                </label>
                <div className="mt-2 space-y-2">
                  {selectedOwner.properties?.map((property) => (
                    <div key={property.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{property.title}</p>
                          <p className="text-sm text-muted-foreground">{property.location}</p>
                        </div>
                        <div className="flex gap-2">
                          {property.tm30AccommodationId && (
                            <Badge>TM30 ✓</Badge>
                          )}
                          {property.bluebookHouseId && (
                            <Badge variant="secondary">BB: {property.bluebookHouseId}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}




