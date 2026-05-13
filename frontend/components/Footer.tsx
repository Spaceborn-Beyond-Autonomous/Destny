import { Link } from "react-router-dom";
import destnyLogo from "@/assets/destny-logo.png";

const footerSections = [
  {
    title: "Website",
    links: [
      { label: "About", href: "/#about" },
      { label: "Services", href: "/#services" },
      { label: "3D Printing", href: "/3d-printing" },
      { label: "MVP Build", href: "/#mvp" },
      { label: "Your Orders", href: "/orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Talent", href: "/#developers" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact", href: "/#contact" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "3D Printing",
    links: [
      { label: "Upload File", href: "/3d-printing#upload" },
      { label: "Instant Quote", href: "/3d-printing#quote" },
      { label: "Materials", href: "/3d-printing#materials" },
      { label: "Pricing", href: "/3d-printing#pricing" },
    ],
  },
];

const Footer = () => (
  <footer id="company" className="border-t border-border/60 bg-background">
    <div className="container mx-auto px-6 py-14">
      <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link to="/#home" className="inline-flex" aria-label="Destny home">
            <img
              src={destnyLogo}
              alt="Destny"
              className="h-9 w-auto object-contain"
              width={941}
              height={277}
            />
          </Link>
          <p className="text-sm text-muted-foreground mt-4 max-w-sm">
            Destny is a full-service technology company founded by Adarsh Kumar, helping India&apos;s students, founders, SMEs, colleges, and creators build what they imagine.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-display font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row gap-3 justify-between text-xs text-muted-foreground">
        <span>© 2026 Destny. All rights reserved.</span>
        <span>hello@destny.in | Build ideas. Prototype fast. Launch with clarity.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
