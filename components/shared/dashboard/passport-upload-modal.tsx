"use client";

import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Guest {
  id: string;
  guestNumber: number;
  guestType: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  passportNumber: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  tm30Status: string;
  passportImageUrl: string | null;
  ocrConfidence: number | null;
  passportVerified: boolean;
}

interface PassportUploadModalProps {
  guest: Guest;
  bookingId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PassportUploadModal({
  guest,
  bookingId,
  open,
  onClose,
  onSuccess,
}: PassportUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(guest.passportImageUrl);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form data for manual entry or editing OCR results
  const [formData, setFormData] = useState({
    firstName: guest.firstName || "",
    lastName: guest.lastName || "",
    passportNumber: guest.passportNumber || "",
    nationality: guest.nationality || "",
    dateOfBirth: guest.dateOfBirth ? guest.dateOfBirth.split("T")[0] : "",
    gender: guest.gender || "",
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImageBase64(base64);
        setUploading(false);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process file");
      setUploading(false);
    }
  };

  const runOcr = async () => {
    if (!imageBase64) {
      setError("Please upload an image first");
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const res = await fetch(`/api/booking-guests/${guest.id}/passport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "OCR failed");
        return;
      }

      setOcrResult(data);
      
      // Update form with OCR results
      if (data.guest) {
        setFormData({
          firstName: data.guest.firstName || "",
          lastName: data.guest.lastName || "",
          passportNumber: data.guest.passportNumber || "",
          nationality: data.guest.nationality || "",
          dateOfBirth: data.guest.dateOfBirth 
            ? new Date(data.guest.dateOfBirth).toISOString().split("T")[0] 
            : "",
          gender: data.guest.gender || "",
        });
      }

      // If OCR was successful, trigger refresh
      if (data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to scan passport");
    } finally {
      setScanning(false);
    }
  };

  const saveManually = async () => {
    if (!formData.firstName || !formData.lastName || !formData.passportNumber) {
      setError("First name, last name, and passport number are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // First upload image if we have one but haven't run OCR
      if (imageBase64 && !ocrResult) {
        const uploadRes = await fetch(`/api/booking-guests/${guest.id}/passport`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            mimeType: "image/jpeg",
          }),
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(data.error || "Failed to upload image");
          return;
        }
      }

      // Update guest data manually via PUT
      const res = await fetch(`/api/booking-guests/${guest.id}/passport`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          passportVerified: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="ph:passport" className="w-5 h-5" />
            Upload Passport - Guest {guest.guestNumber}
          </DialogTitle>
          <DialogDescription>
            Upload a passport photo or enter details manually for TM30 registration
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Left: Image Upload */}
          <div className="space-y-4">
            <Label>Passport Image</Label>
            
            {/* Dropzone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Passport preview"
                    className="w-full h-48 object-contain rounded"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewUrl(null);
                      setImageBase64(null);
                      setOcrResult(null);
                    }}
                  >
                    <Icon icon="ph:x" className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Icon 
                    icon="ph:cloud-arrow-up" 
                    className="w-12 h-12 mx-auto text-gray-400 mb-4" 
                  />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop passport image here
                  </p>
                  <p className="text-xs text-gray-400 mb-4">or</p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Icon icon="ph:folder-open" className="w-4 h-4 mr-2" />
                        Browse Files
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon icon="ph:spinner" className="w-4 h-4 animate-spin" />
                Processing image...
              </div>
            )}

            {/* Scan Button */}
            {imageBase64 && !ocrResult && (
              <Button 
                onClick={runOcr} 
                disabled={scanning}
                className="w-full"
              >
                {scanning ? (
                  <>
                    <Icon icon="ph:spinner" className="w-4 h-4 mr-2 animate-spin" />
                    Scanning Passport...
                  </>
                ) : (
                  <>
                    <Icon icon="ph:scan" className="w-4 h-4 mr-2" />
                    Scan Passport (OCR)
                  </>
                )}
              </Button>
            )}

            {/* OCR Result */}
            {ocrResult && (
              <div className={`p-4 rounded-lg ${ocrResult.success ? "bg-green-50" : "bg-yellow-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon 
                    icon={ocrResult.success ? "ph:check-circle" : "ph:warning"} 
                    className={`w-5 h-5 ${ocrResult.success ? "text-green-600" : "text-yellow-600"}`}
                  />
                  <span className="font-medium">
                    {ocrResult.success ? "Scan Complete" : "Partial Scan"}
                  </span>
                  {ocrResult.ocrResult?.confidence && (
                    <Badge variant="outline">
                      {Math.round(ocrResult.ocrResult.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                {ocrResult.validation?.warnings?.length > 0 && (
                  <ul className="text-sm text-yellow-700 mt-2">
                    {ocrResult.validation.warnings.map((w: string, i: number) => (
                      <li key={i}>⚠️ {w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Right: Form Fields */}
          <div className="space-y-4">
            <Label>Passport Details</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xs">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="JOHN"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="DOE"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="passportNumber" className="text-xs">Passport Number *</Label>
              <Input
                id="passportNumber"
                value={formData.passportNumber}
                onChange={(e) => handleInputChange("passportNumber", e.target.value.toUpperCase())}
                placeholder="AB1234567"
              />
            </div>

            <div>
              <Label htmlFor="nationality" className="text-xs">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleInputChange("nationality", e.target.value.toUpperCase())}
                placeholder="NETHERLANDS"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-xs">Gender</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <Icon icon="ph:warning" className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Save Button */}
            <Button 
              onClick={saveManually}
              disabled={saving || !formData.firstName || !formData.lastName || !formData.passportNumber}
              className="w-full"
              variant="default"
            >
              {saving ? (
                <>
                  <Icon icon="ph:spinner" className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="ph:check" className="w-4 h-4 mr-2" />
                  Verify & Save
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

