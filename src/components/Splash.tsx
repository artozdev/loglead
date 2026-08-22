// Branded loading screen — LogLead blue background, white logo, progress bar.
// Pure markup (no hooks) so it works as a Next `loading.tsx` and inside overlays.
export default function Splash() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #2475F5 0%, #0051FF 55%, #1D4ED8 100%)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loglead-logo-appicon.svg" alt="LogLead" className="h-9 w-auto" />
      <div className="splash-track mt-7 h-1 w-56 overflow-hidden rounded-full bg-white/20">
        <div className="splash-bar h-full rounded-full bg-white/90" />
      </div>
    </div>
  );
}
