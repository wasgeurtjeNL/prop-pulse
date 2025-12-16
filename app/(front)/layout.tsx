import Header from "@/components/new-design/layout/header";
import Footer from "@/components/new-design/layout/footer";
import ScrollToTop from "@/components/new-design/scroll-to-top";

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div
        className="min-h-screen"
        style={{ paddingTop: "var(--pp-header-offset, 0px)" }}
      >
        {children}
      </div>
      <Footer />
      <ScrollToTop />
    </>
  );
}
