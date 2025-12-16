"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { toast } from "sonner";

interface Submission {
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
  updatedAt: Date;
}

const statusConfig: Record<string, { label: string; color: string; icon: string; description: string }> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "ph:clock",
    description: "Your submission is in our queue and will be reviewed within 24 hours.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "ph:magnifying-glass",
    description: "Our team is currently reviewing your property details.",
  },
  INFO_REQUESTED: {
    label: "Info Requested",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "ph:question",
    description: "We need additional information. Please check the review notes below.",
  },
  APPROVED: {
    label: "Approved - Upload Images",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "ph:check-circle",
    description: "Your property has been approved! Please upload photos of your property.",
  },
  IMAGES_UPLOADED: {
    label: "Images Under Review",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "ph:images",
    description: "Your images are being reviewed. We'll finalize your listing soon.",
  },
  READY_TO_PUBLISH: {
    label: "Ready to Publish",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: "ph:rocket-launch",
    description: "Everything is approved! Your listing will be live shortly.",
  },
  PUBLISHED: {
    label: "Live on Website",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: "ph:globe",
    description: "Congratulations! Your property is now live and visible to buyers.",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "ph:x-circle",
    description: "Unfortunately, your submission was not approved. See notes below.",
  },
};

const categoryLabels: Record<string, string> = {
  LUXURY_VILLA: "Luxury Villa",
  APARTMENT: "Apartment / Condo",
  RESIDENTIAL_HOME: "Residential Home",
  OFFICE_SPACES: "Commercial / Office",
};

export default function SubmissionDetail({ submission }: { submission: Submission }) {
  const [images, setImages] = useState<string[]>(submission.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const status = statusConfig[submission.status] || statusConfig.PENDING_REVIEW;
  const canUploadImages = submission.status === "APPROVED";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedFiles.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setUploading(true);
    try {
      // Upload images to ImageKit or your preferred service
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append("files", file));
      formData.append("submissionId", submission.id);
      formData.append("accessToken", submission.accessToken);

      const response = await fetch("/api/property-submissions/upload-images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setImages(data.images);
      setUploadedFiles([]);
      toast.success("Images uploaded successfully! We'll review them shortly.");
      
      // Refresh page to update status
      window.location.reload();
    } catch (error) {
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Your Property Submission
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track the progress of your listing for <strong>{submission.propertyTitle}</strong>
        </p>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 mb-8 border ${status.color}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
            <Icon icon={status.icon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{status.label}</h2>
            <p className="text-sm opacity-80">{status.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Review Notes (if any) */}
      {submission.reviewNotes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Icon icon="ph:note-pencil" className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                Notes from our team:
              </h3>
              <p className="text-amber-700 dark:text-amber-400 whitespace-pre-wrap">
                {submission.reviewNotes}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Image Upload Section (when approved) */}
      {canUploadImages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="ph:images" className="w-6 h-6 text-primary" />
            Upload Property Images
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Upload high-quality photos of your property. We recommend at least 5 images including exterior, 
            interior, bedrooms, bathrooms, and any special features.
          </p>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center mb-6">
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Icon icon="ph:cloud-arrow-up" className="w-12 h-12 text-slate-400 mb-3" />
              <span className="text-slate-600 dark:text-slate-400">
                Click to upload or drag and drop
              </span>
              <span className="text-sm text-slate-500 mt-1">
                PNG, JPG, WEBP up to 10MB each (max 10 images)
              </span>
            </label>
          </div>

          {/* Selected Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon icon="ph:x" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUploadImages}
            disabled={uploading || uploadedFiles.length === 0}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Icon icon="ph:upload-simple" className="w-5 h-5" />
                Upload {uploadedFiles.length} Image{uploadedFiles.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Uploaded Images Gallery */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="ph:images" className="w-6 h-6 text-primary" />
            Your Property Images
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="aspect-video rounded-lg overflow-hidden bg-slate-100 relative">
                <Image
                  src={image}
                  alt={`Property ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Property Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Icon icon="ph:house" className="w-6 h-6 text-primary" />
          Property Details
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Property Title</label>
              <p className="font-medium text-slate-900 dark:text-white">{submission.propertyTitle}</p>
            </div>
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Category</label>
              <p className="font-medium text-slate-900 dark:text-white">
                {categoryLabels[submission.propertyCategory] || submission.propertyCategory}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Listing Type</label>
              <p className="font-medium text-slate-900 dark:text-white">
                {submission.propertyType === "FOR_SALE" ? "For Sale" : "For Rent"}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Location</label>
              <p className="font-medium text-slate-900 dark:text-white">{submission.location}</p>
            </div>
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Asking Price</label>
              <p className="font-medium text-slate-900 dark:text-white">฿{submission.askingPrice}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">Bedrooms</label>
                <p className="font-medium text-slate-900 dark:text-white">{submission.beds}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">Bathrooms</label>
                <p className="font-medium text-slate-900 dark:text-white">{submission.baths}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">Size</label>
                <p className="font-medium text-slate-900 dark:text-white">{submission.sqft} m²</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Package</label>
              <p className="font-medium text-slate-900 dark:text-white">
                {submission.exclusiveRights ? (
                  <span className="text-primary">Exclusive Partnership ({submission.commissionRate}%)</span>
                ) : (
                  <span>Standard Listing ({submission.commissionRate}%)</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400">Submitted</label>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(submission.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <label className="text-sm text-slate-500 dark:text-slate-400">Description</label>
          <p className="mt-2 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {submission.description}
          </p>
        </div>
      </motion.div>

      {/* Contact Owner Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 mt-8 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon icon="ph:user" className="w-6 h-6 text-primary" />
          Your Contact Information
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400">Name</label>
            <p className="font-medium text-slate-900 dark:text-white">{submission.ownerName}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400">Email</label>
            <p className="font-medium text-slate-900 dark:text-white">{submission.ownerEmail}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400">Phone</label>
            <p className="font-medium text-slate-900 dark:text-white">{submission.ownerPhone}</p>
          </div>
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Questions about your submission?
        </p>
        <a
          href="mailto:info@psmphuket.com"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <Icon icon="ph:envelope" className="w-5 h-5" />
          Contact us at info@psmphuket.com
        </a>
      </motion.div>
    </div>
  );
}



