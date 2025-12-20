import Header from "@/components/new-design/layout/header";
import Footer from "@/components/new-design/layout/footer";
import ScrollToTop from "@/components/new-design/scroll-to-top";
import ChatWidgetLoader from "@/components/chatbot/ChatWidgetLoader";

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
