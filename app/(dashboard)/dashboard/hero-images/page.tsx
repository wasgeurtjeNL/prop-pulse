import { getAllHeroImages } from "@/lib/actions/hero-image.actions";
import HeroImageManager from "@/components/shared/dashboard/hero-image-manager";

export const metadata = {
  title: "Hero Images | Dashboard",
  description: "Manage hero images for different pages and device types",
};

export default async function HeroImagesPage() {
  const { data: initialImages } = await getAllHeroImages();

  return (
    <div className="space-y-6">
      <HeroImageManager initialImages={initialImages || []} />
    </div>
  );
}



