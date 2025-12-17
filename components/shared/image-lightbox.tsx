"use client"

import React, { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  images: { src: string; alt?: string }[]
  isOpen: boolean
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function ImageLightbox({
  images,
  isOpen,
  currentIndex,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const hasMultipleImages = images.length > 1

  const nextImage = useCallback(() => {
    onIndexChange((currentIndex + 1) % images.length)
  }, [currentIndex, images.length, onIndexChange])

  const previousImage = useCallback(() => {
    onIndexChange((currentIndex - 1 + images.length) % images.length)
  }, [currentIndex, images.length, onIndexChange])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          previousImage()
          break
        case 'ArrowRight':
          nextImage()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, nextImage, previousImage])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[10000] text-white hover:text-gray-300 transition-colors p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70"
        aria-label="Close lightbox"
      >
        <Icon icon="ph:x" width={24} height={24} className="sm:w-8 sm:h-8" />
      </button>

      {/* Previous Button */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            previousImage()
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70"
          aria-label="Previous image"
        >
          <Icon icon="ph:caret-left" width={28} height={28} className="sm:w-10 sm:h-10" />
        </button>
      )}

      {/* Image Container */}
      <div
        className={cn(
          "relative max-w-7xl w-full h-full flex items-center justify-center",
          hasMultipleImages ? "max-h-[85vh] sm:max-h-[90vh] pb-20 sm:pb-24" : "max-h-[90vh] sm:max-h-[95vh]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={currentImage.src}
          alt={currentImage.alt || `Image ${currentIndex + 1}`}
          width={1920}
          height={1080}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
          unoptimized={true}
        />

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Next Button */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            nextImage()
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70"
          aria-label="Next image"
        >
          <Icon icon="ph:caret-right" width={28} height={28} className="sm:w-10 sm:h-10" />
        </button>
      )}

      {/* Thumbnail Strip */}
      {hasMultipleImages && (
        <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 max-w-[90vw] overflow-x-auto px-2 sm:px-4 pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                onIndexChange(index)
              }}
              className={cn(
                "flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-white scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={image.src}
                alt={image.alt || `Thumbnail ${index + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized={true}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}



