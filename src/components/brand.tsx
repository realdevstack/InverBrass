import Image from "next/image";

/**
 * Brand assets, taken from the member's artwork.
 *   public/Inverbras-logo.jpg  — the full lockup (hexagon + wordmark)
 *   public/logo-mark.png       — the hexagon cropped out for the nav rail
 * Replace either file to update the logo; the components need no change.
 */
export function BrandMark({ className = "h-8 w-auto" }: { className?: string }) {
  return <Image src="/logo-mark.png" alt="Inverbras" width={26} height={32} className={className} priority />;
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/Inverbras-logo.jpg"
      alt="Inverbras Electricals Pvt Ltd"
      width={300}
      height={167}
      className={className}
      priority
    />
  );
}
