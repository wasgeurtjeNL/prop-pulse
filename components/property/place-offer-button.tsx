"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, Loader2, Flame, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import PlaceOfferModal from "./place-offer-modal";

interface PlaceOfferButtonProps {
  propertyId: string;
  propertyTitle: string;
  askingPrice: string;
  className?: string;
}

interface OfferStatus {
  biddingEnabled: boolean;
  hasActiveOffers: boolean;
  offerCount: number;
  minBid: number;
  askingPrice: number;
  hasRejectedOffers: boolean;
}

export default function PlaceOfferButton({
  propertyId,
  propertyTitle,
  askingPrice,
  className,
}: PlaceOfferButtonProps) {
  const { data: session } = authClient.useSession();
  const [offerStatus, setOfferStatus] = useState<OfferStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchOfferStatus = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/offer-status`);
        if (response.ok) {
          const data = await response.json();
          setOfferStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch offer status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferStatus();
  }, [propertyId]);

  const handleClick = () => {
    if (!session?.user) {
      // Redirect to login with return URL
      window.location.href = `/sign-in?redirect=/properties/${propertyId}?bid=true`;
      return;
    }
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Laden...
      </Button>
    );
  }

  if (!offerStatus?.biddingEnabled) {
    return null; // Don't show button if bidding is disabled
  }

  return (
    <>
      <div className="space-y-2">
        {/* FOMO Banner */}
        {offerStatus.hasActiveOffers && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="destructive" className="animate-pulse">
              <Flame className="h-3 w-3 mr-1" />
              {offerStatus.offerCount} actieve bieding{offerStatus.offerCount !== 1 ? "en" : ""}
            </Badge>
            <span className="text-muted-foreground">- Bied nu!</span>
          </div>
        )}

        <Button
          onClick={handleClick}
          size="lg"
          className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 ${className}`}
        >
          {session?.user ? (
            <>
              <Gavel className="h-5 w-5 mr-2" />
              Plaats Bieding
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2" />
              Inloggen om te bieden
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Minimum bod: ฿{offerStatus.minBid?.toLocaleString()} (80% van vraagprijs)
        </p>
      </div>

      {session?.user && (
        <PlaceOfferModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          askingPrice={offerStatus.askingPrice}
          minBid={offerStatus.minBid}
          userName={session.user.name || ""}
          userEmail={session.user.email || ""}
        />
      )}
    </>
  );
}
