import dynamic from "next/dynamic";
import Header from "@/components/new-design/layout/header";
import ChatWidgetLoader from "@/components/chatbot/ChatWidgetLoader";

// Lazy load Footer - not needed for initial page render (below fold)
const Footer = dynamic(() => import("@/components/new-design/layout/footer"), {
  ssr: true, // Keep SSR for SEO (footer contains links)
});

// Lazy load ScrollToTop - only visible after scrolling
const ScrollToTop = dynamic(
  () => import("@/components/new-design/scroll-to-top"),
  { ssr: false }
);

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Note: HeroImagePreloader moved to homepage only to avoid unused preloads on other pages */}
      <Header />
      <div
        className="min-h-screen"
        style={{ paddingTop: "var(--pp-header-offset, 0px)" }}
      >
        {children}
      </div>
      <Footer />
      <ScrollToTop />
      {/* Lazy loaded via client component wrapper */}
      <ChatWidgetLoader />
    </>
  );
}
