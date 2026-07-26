type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

/**
 * LogLead brand mark, served from the real vector assets in /public:
 *   - public/loglead-logo.svg  (icon + "loglead" wordmark) — used with wordmark
 *   - public/loglead-icon.svg  (icon only)                 — used collapsed
 * Swap those files to update the brand everywhere. `size` is the render height.
 */
export default function Logo({
  size = 32,
  withWordmark = false,
  className = "",
}: LogoProps) {
  if (withWordmark) {
    // Two variants swapped purely via CSS (see globals.css .logo-light/.logo-dark)
    // so the wordmark text turns white in dark mode with zero flash.
    return (
      <span className={`block ${className}`} style={{ height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/loglead-logo.svg"
          alt="loglead"
          className="logo-light block w-auto"
          style={{ height: size }}
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/loglead-logo-dark.svg"
          alt="loglead"
          className="logo-dark w-auto"
          style={{ height: size }}
          draggable={false}
        />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/loglead-icon.svg"
      alt="loglead"
      width={size}
      height={size}
      className={`block shrink-0 ${className}`}
      draggable={false}
    />
  );
}
