import Image from "next/image";

/**
 * Brand assets. `public/logo.svg` is the full lockup and `public/logo-mark.svg`
 * is the compact hexagon used in the navigation rail. Replace either file with
 * the exact artwork if the drawn version is not wanted; the components need no
 * change.
 */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return <Image src="/logo-mark.svg" alt="Inverbras" width={32} height={32} className={className} priority />;
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Inverbras Electricals Pvt Ltd"
      width={280}
      height={60}
      className={className}
      priority
    />
  );
}
