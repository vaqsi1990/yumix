import Link from "next/link";
import Logo from "@/components/Logo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const socialLinks = [
  {
    href: siteConfig.social.instagram,
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: siteConfig.social.facebook,
    label: "Facebook",
    icon: FacebookIcon,
  },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
        <div className="flex items-start justify-between gap-6">
          <Logo />

          <div className="flex flex-col items-end gap-2">
            <p className="text-base md:text-[18px] font-medium text-neutral-700">გამოგვყევი</p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(
                    "rounded-full p-2 text-neutral-500 transition",
                    "hover:bg-[#FF0050]/10 hover:text-[#FF0050]",
                  )}
                >
                  <Icon className="size-6 md:size-7" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      
      
      </div>
    </footer>
  );
}
