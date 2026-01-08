import dynamic from "next/dynamic";
import Header from "@/components/new-design/layout/header";
import ChatWidgetLoader from "@/components/chatbot/ChatWidgetLoader";

// Lazy load Footer - not needed for initial page render (below fold)
const Footer = dynamic(() => import("@/components/new-design/layout/footer"));

// Lazy load ScrollToTop - not critical for initial render
const ScrollToTop = dynamic(
  () => import("@/components/new-design/scroll-to-top")
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
