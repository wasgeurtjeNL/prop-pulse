-- WhatsApp Listing Sessions
-- Tracks conversation state for WhatsApp bot listing workflow

CREATE TABLE whatsapp_listing_session (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- WhatsApp User Info
  phone_number TEXT NOT NULL,
  whatsapp_id TEXT NOT NULL UNIQUE,
  
  -- Session State
  status TEXT NOT NULL DEFAULT 'AWAITING_PHOTOS',
  -- AWAITING_PHOTOS: Waiting for user to upload photos
  -- COLLECTING_PHOTOS: Receiving photos (min 8)
  -- AWAITING_MORE_PHOTOS: Asked if user wants more photos
  -- AWAITING_LOCATION: Waiting for GPS location share
  -- PROCESSING: AI analyzing photos and generating content
  -- AWAITING_CONFIRMATION: Showing preview, waiting for confirmation
  -- COMPLETED: Property created successfully
  -- CANCELLED: User cancelled the flow
  -- ERROR: Something went wrong
  
  -- Collected Data
  images TEXT[] DEFAULT '{}',
  image_count INTEGER DEFAULT 0,
  
  -- Location Data (from WhatsApp location share)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  address TEXT,
  district TEXT,
  
  -- AI Extracted Data
  detected_features JSONB,
  -- {
  --   "propertyType": "LUXURY_VILLA",
  --   "beds": 3,
  --   "baths": 2,
  --   "hasPool": true,
  --   "hasGarage": true,
  --   "amenities": ["pool", "garage", "garden"],
  --   "style": "modern",
  --   "condition": "new"
  -- }
  
  -- Generated Content
  generated_title TEXT,
  generated_description TEXT,
  generated_content_html TEXT,
  suggested_price TEXT,
  
  -- POI Data
  poi_scores JSONB,
  -- {
  --   "beachScore": 85,
  --   "familyScore": 70,
  --   "convenienceScore": 90,
  --   "quietnessScore": 75,
  --   "nearbyPois": [...]
  -- }
  
  -- Final Property Reference
  property_id TEXT,
  
  -- Agent/Admin who initiated
  initiated_by TEXT,
  initiated_by_name TEXT,
  
  -- Error tracking
  error_message TEXT,
  error_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Expiry (sessions expire after 24 hours)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes
CREATE INDEX idx_whatsapp_session_phone ON whatsapp_listing_session(phone_number);
CREATE INDEX idx_whatsapp_session_status ON whatsapp_listing_session(status);
CREATE INDEX idx_whatsapp_session_created ON whatsapp_listing_session(created_at);
CREATE INDEX idx_whatsapp_session_expires ON whatsapp_listing_session(expires_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_session_updated_at
  BEFORE UPDATE ON whatsapp_listing_session
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_session_updated_at();




