"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import PassportUploadModal from "./passport-upload-modal";

interface PlaceOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  askingPrice: number;
  minBid: number;
  userName: string;
  userEmail: string;
}

export default function PlaceOfferModal({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  askingPrice,
  minBid,
  userName,
  userEmail,
}: PlaceOfferModalProps) {
  const [step, setStep] = useState<"offer" | "passport" | "success">("offer");
  const [submitting, setSubmitting] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);

  // Form state
  const [offerAmount, setOfferAmount] = useState<string>("");
  const [buyerName, setBuyerName] = useState(userName);
  const [buyerEmail, setBuyerEmail] = useState(userEmail);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");

  const offerAmountNum = parseFloat(offerAmount.replace(/,/g, "")) || 0;
  const percentageOfAsking = askingPrice > 0 ? (offerAmountNum / askingPrice) * 100 : 0;
  const isValidAmount = offerAmountNum >= minBid;

  const handleSubmitOffer = async () => {
    if (!isValidAmount) {
      toast.error(`Bod moet minimaal ฿${minBid.toLocaleString()} zijn`);
      return;
    }

    if (!buyerName || !buyerEmail || !buyerPhone) {
      toast.error("Vul alle verplichte velden in");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          offerAmount: offerAmountNum,
          buyerName,
          buyerEmail,
          buyerPhone,
          buyerMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Kon bod niet plaatsen");
        return;
      }

      setOfferId(data.offer.id);
      setStep("passport");
      toast.success("Bod geplaatst! Upload nu uw paspoort.");
    } catch (error) {
      toast.error("Er ging iets mis bij het plaatsen van uw bod");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePassportComplete = () => {
    setStep("success");
  };

  const handleClose = () => {
    setStep("offer");
    setOfferAmount("");
    setBuyerPhone("");
    setBuyerMessage("");
    setOfferId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === "offer" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Plaats Bieding
              </DialogTitle>
              <DialogDescription>
                Plaats een bod op "{propertyTitle}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Asking Price Info */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vraagprijs</span>
                  <span className="font-bold text-lg">฿{askingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Minimum bod (80%)</span>
                  <span className="font-medium">฿{minBid.toLocaleString()}</span>
                </div>
              </div>

              {/* Offer Amount */}
              <div className="space-y-2">
                <Label htmlFor="offerAmount">Uw bod (THB) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                  <Input
                    id="offerAmount"
                    type="text"
                    value={offerAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,]/g, "");
                      setOfferAmount(value);
                    }}
                    placeholder="15,000,000"
                    className="pl-8"
                  />
                </div>
                {offerAmountNum > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={isValidAmount ? "default" : "destructive"}
                      className={isValidAmount ? "bg-green-500" : ""}
                    >
                      {percentageOfAsking.toFixed(1)}% van vraagprijs
                    </Badge>
                    {!isValidAmount && (
                      <span className="text-xs text-red-500">Minimum is 80%</span>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerName">Naam *</Label>
                  <Input
                    id="buyerName"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerPhone">Telefoon *</Label>
                  <Input
                    id="buyerPhone"
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerEmail">E-mail *</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerMessage">Bericht (optioneel)</Label>
                <Textarea
                  id="buyerMessage"
                  value={buyerMessage}
                  onChange={(e) => setBuyerMessage(e.target.value)}
                  placeholder="Eventuele opmerkingen of vragen..."
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Paspoort verificatie vereist
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Na het plaatsen van uw bod moet u uw paspoort uploaden ter verificatie. 
                      Uw bod wordt pas actief na ontvangst van uw paspoort.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuleren
              </Button>
              <Button
                onClick={handleSubmitOffer}
                disabled={!isValidAmount || submitting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Gavel className="h-4 w-4 mr-2" />
                    Plaats Bod
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "passport" && offerId && (
          <PassportUploadModal
            offerId={offerId}
            onComplete={handlePassportComplete}
            onClose={handleClose}
          />
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                Bod Succesvol Geplaatst!
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <FileCheck className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-medium">Uw bod is ingediend!</p>
                <p className="text-muted-foreground mt-2">
                  Uw bod van <span className="font-bold">฿{offerAmountNum.toLocaleString()}</span> is 
                  succesvol geplaatst en uw paspoort is ontvangen.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  De eigenaar heeft 20 dagen om te reageren. U ontvangt een e-mail zodra er nieuws is.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Sluiten
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
