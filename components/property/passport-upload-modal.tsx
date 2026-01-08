"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  FileCheck,
  AlertTriangle,
  Camera,
  Shield,
  CheckCircle2,
} from "lucide-react";

interface PassportUploadModalProps {
  offerId: string;
  onComplete: () => void;
  onClose: () => void;
}

interface PassportData {
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  passportNumber: string;
  dateOfBirth: string;
  expiry: string;
  gender: string;
}

export default function PassportUploadModal({
  offerId,
  onComplete,
  onClose,
}: PassportUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Alleen afbeeldingen zijn toegestaan");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Bestand is te groot (max 10MB)");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1];

        // Upload to API
        const response = await fetch(`/api/offers/${offerId}/passport`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Kon paspoort niet uploaden");
          setUploading(false);
          return;
        }

        setPassportData(data.offer.passportData);
        setOcrConfidence(data.offer.ocrConfidence || 0);
        setUploaded(true);
        setUploading(false);

        if (data.success) {
          toast.success("Paspoort succesvol geverifieerd!");
        } else {
          toast.warning("Paspoort geüpload maar kon niet volledig worden geverifieerd");
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Er ging iets mis bij het uploaden");
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [offerId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  if (uploaded && passportData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileCheck className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Paspoort Ontvangen</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Controleer de gegevens hieronder
          </p>
        </div>

        {/* OCR Confidence */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={ocrConfidence > 0.8 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {Math.round(ocrConfidence * 100)}% herkenning
          </Badge>
        </div>

        {/* Extracted Data */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Volledige naam</Label>
              <p className="font-medium">{passportData.fullName || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Nationaliteit</Label>
              <p className="font-medium">{passportData.nationality || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Paspoort nummer</Label>
              <p className="font-medium">{passportData.passportNumber || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Geslacht</Label>
              <p className="font-medium">
                {passportData.gender === "M" ? "Man" : passportData.gender === "F" ? "Vrouw" : "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Geboortedatum</Label>
              <p className="font-medium">
                {passportData.dateOfBirth 
                  ? new Date(passportData.dateOfBirth).toLocaleDateString("nl-NL") 
                  : "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Geldig tot</Label>
              <p className="font-medium">
                {passportData.expiry 
                  ? new Date(passportData.expiry).toLocaleDateString("nl-NL") 
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Beveiligde opslag
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Uw paspoort wordt beveiligd opgeslagen en is alleen zichtbaar voor de eigenaar van deze woning.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuleren
          </Button>
          <Button 
            onClick={onComplete} 
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Bevestigen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold">Upload Paspoort</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload een foto van uw paspoort om uw bod te bevestigen
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-muted-foreground">
              Paspoort wordt verwerkt...
            </p>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="font-medium">Sleep uw paspoort hier</p>
            <p className="text-sm text-muted-foreground mt-1">
              of klik om een bestand te selecteren
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Belangrijke informatie
            </p>
            <ul className="text-amber-700 dark:text-amber-300 mt-1 space-y-1 list-disc list-inside">
              <li>Zorg dat de foto scherp en goed leesbaar is</li>
              <li>Upload de pagina met uw foto</li>
              <li>Uw paspoort mag niet verlopen zijn</li>
            </ul>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">
        Later uploaden
      </Button>
    </div>
  );
}
