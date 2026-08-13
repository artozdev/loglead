type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  /**
   * "App icon" variant: the mark is drawn as a solid white "L" on the blue
   * rounded square (instead of a transparent knockout). Meant for the always
   * dark sidebar, where a knockout L would read black. Login + landing keep
   * the default variant.
   */
  appIcon?: boolean;
};

/**
 * LogLead brand mark, served from the real vector assets in /public:
 *   - public/loglead-logo.svg      (icon + "loglead" wordmark) — used with wordmark
 *   - public/loglead-icon.svg      (icon only)                 — used collapsed
 *   - public/loglead-logo-appicon.svg / loglead-app-icon.svg  — solid white-L variant
 * Swap those files to update the brand everywhere. `size` is the render height.
 */
export default function Logo({
  size = 32,
  withWordmark = false,
  className = "",
  appIcon = false,
}: LogoProps) {
  if (appIcon) {
    const src = withWordmark ? "/loglead-logo-appicon.svg" : "/loglead-app-icon.svg";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="loglead"
        className={`block w-auto shrink-0 ${className}`}
        style={{ height: size }}
        draggable={false}
      />
    );
  }
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
