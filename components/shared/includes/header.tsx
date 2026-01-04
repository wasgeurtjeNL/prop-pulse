import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { Menu } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import UserDropdown from "../user/user-dropdown";

const Header = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://ik.imagekit.io/slydc8kod/logo_psm_300.webp?tr=w-100,q-90,f-auto"
            alt="PSM Phuket Logo"
            width={100}
            height={35}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link
            href="/properties"
            className="hover:text-primary transition-colors"
          >
            Properties
          </Link>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors"
          >
            Contact
          </Link>
        </nav>

        {session ? (
          <UserDropdown />
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="hidden sm:flex" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
