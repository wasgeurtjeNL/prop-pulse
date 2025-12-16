import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Retrieve company profile
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site settings as fallback
    const settings = await prisma.siteSettings.findFirst();

    // Get or create company profile
    let profile = null;
    try {
      profile = await prisma.companyProfile.findUnique({
        where: { id: "default" }
      });

      if (!profile) {
        profile = await prisma.companyProfile.create({
          data: {
            id: "default",
            companyName: settings?.siteName || "",
            description: settings?.companyDescription || "",
            tone: settings?.companyTone || "professional",
            targetAudience: settings?.targetAudience || "",
            usps: settings?.companyUSPs || "[]",
            brandKeywords: settings?.brandKeywords || "[]",
            avoidTopics: settings?.avoidTopics || "[]"
          }
        });
      }
    } catch (e) {
      console.log("CompanyProfile model error, using empty profile");
      // Return empty profile structure
      profile = {
        companyName: settings?.siteName || "",
        tagline: "",
        description: settings?.companyDescription || "",
        tone: settings?.companyTone || "professional",
        writingStyle: "",
        targetAudience: settings?.targetAudience || "",
        targetLocations: "[]",
        usps: settings?.companyUSPs || "[]",
        expertise: "[]",
        contentThemes: "[]",
        brandKeywords: settings?.brandKeywords || "[]",
        avoidTopics: settings?.avoidTopics || "[]",
        competitors: "[]",
        websiteUrl: "",
        lastAnalyzedAt: null
      };
    }

    // Get internal links
    let internalLinks: any[] = [];
    try {
      internalLinks = await prisma.internalLink.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "desc" }, { usageCount: "desc" }]
      });
    } catch (e) {
      console.log("InternalLink model error, returning empty array");
    }

    return NextResponse.json({
      profile: {
        companyName: profile.companyName || "",
        tagline: profile.tagline || "",
        description: profile.description || "",
        tone: profile.tone || "professional",
        writingStyle: profile.writingStyle || "",
        targetAudience: profile.targetAudience || "",
        targetLocations: profile.targetLocations ? JSON.parse(profile.targetLocations) : [],
        usps: profile.usps ? JSON.parse(profile.usps) : [],
        expertise: profile.expertise ? JSON.parse(profile.expertise) : [],
        contentThemes: profile.contentThemes ? JSON.parse(profile.contentThemes) : [],
        brandKeywords: profile.brandKeywords ? JSON.parse(profile.brandKeywords) : [],
        avoidTopics: profile.avoidTopics ? JSON.parse(profile.avoidTopics) : [],
        competitors: profile.competitors ? JSON.parse(profile.competitors) : [],
        websiteUrl: profile.websiteUrl || "",
        lastAnalyzedAt: profile.lastAnalyzedAt?.toISOString() || null
      },
      internalLinks: internalLinks.map(link => ({
        id: link.id,
        url: link.url,
        title: link.title,
        description: link.description || "",
        category: link.category || "page",
        keywords: link.keywords || "",
        priority: link.priority,
        usageCount: link.usageCount
      }))
    });

  } catch (error: any) {
    console.error("Get Profile Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get profile" },
      { status: 500 }
    );
  }
}

// POST - Save company profile (from website analysis or manual input)
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { profile, internalLinks } = data;

    // Update or create company profile
    const updatedProfile = await prisma.companyProfile.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        companyName: profile.companyName || "",
        tagline: profile.tagline || "",
        description: profile.description || "",
        tone: profile.tone || "professional",
        writingStyle: profile.writingStyle || "",
        targetAudience: profile.targetAudience || "",
        targetLocations: JSON.stringify(profile.targetLocations || []),
        usps: JSON.stringify(profile.usps || []),
        expertise: JSON.stringify(profile.expertise || []),
        contentThemes: JSON.stringify(profile.contentThemes || []),
        brandKeywords: JSON.stringify(profile.brandKeywords || []),
        avoidTopics: JSON.stringify(profile.avoidTopics || []),
        competitors: JSON.stringify(profile.competitors || []),
        websiteUrl: profile.websiteUrl || "",
        lastAnalyzedAt: profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt) : null,
        analysisData: profile.analysisData || ""
      },
      update: {
        companyName: profile.companyName || "",
        tagline: profile.tagline || "",
        description: profile.description || "",
        tone: profile.tone || "professional",
        writingStyle: profile.writingStyle || "",
        targetAudience: profile.targetAudience || "",
        targetLocations: JSON.stringify(profile.targetLocations || []),
        usps: JSON.stringify(profile.usps || []),
        expertise: JSON.stringify(profile.expertise || []),
        contentThemes: JSON.stringify(profile.contentThemes || []),
        brandKeywords: JSON.stringify(profile.brandKeywords || []),
        avoidTopics: JSON.stringify(profile.avoidTopics || []),
        competitors: JSON.stringify(profile.competitors || []),
        websiteUrl: profile.websiteUrl || "",
        lastAnalyzedAt: profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt) : null,
        analysisData: profile.analysisData || ""
      }
    });

    // Also sync to SiteSettings for backward compatibility
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        siteName: profile.companyName || "Real Estate Pulse",
        companyDescription: profile.description || "",
        companyTone: profile.tone || "professional",
        targetAudience: profile.targetAudience || "",
        companyUSPs: JSON.stringify(profile.usps || []),
        brandKeywords: JSON.stringify(profile.brandKeywords || []),
        avoidTopics: JSON.stringify(profile.avoidTopics || []),
        websiteUrl: profile.websiteUrl || "",
        lastScannedAt: profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt) : null,
        scannedPagesCount: profile.pagesAnalyzed || null,
        scanConfidence: profile.confidence || null,
        detectedThemes: JSON.stringify(profile.contentThemes || [])
      },
      update: {
        siteName: profile.companyName || undefined,
        companyDescription: profile.description || undefined,
        companyTone: profile.tone || undefined,
        targetAudience: profile.targetAudience || undefined,
        companyUSPs: JSON.stringify(profile.usps || []),
        brandKeywords: JSON.stringify(profile.brandKeywords || []),
        avoidTopics: JSON.stringify(profile.avoidTopics || []),
        websiteUrl: profile.websiteUrl || undefined,
        lastScannedAt: profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt) : undefined,
        scannedPagesCount: profile.pagesAnalyzed || undefined,
        scanConfidence: profile.confidence || undefined,
        detectedThemes: JSON.stringify(profile.contentThemes || [])
      }
    });

    // Update internal links if provided
    if (internalLinks && Array.isArray(internalLinks)) {
      for (const link of internalLinks) {
        if (link.url) {
          await prisma.internalLink.upsert({
            where: { url: link.url },
            create: {
              url: link.url,
              title: link.title || "",
              description: link.description || "",
              category: link.category || "page",
              keywords: link.keywords || "",
              priority: link.priority || 1,
              isActive: true
            },
            update: {
              title: link.title || "",
              description: link.description || "",
              category: link.category || "page",
              keywords: link.keywords || "",
              priority: link.priority || 1,
              isActive: true
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully"
    });

  } catch (error: any) {
    console.error("Save Profile Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save profile" },
      { status: 500 }
    );
  }
}

