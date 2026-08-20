"use client";

import Script from "next/script";

// Crisp live chat — loaded after hydration so it never blocks first paint.
// The Website ID is public by design (it ships in the client snippet).
const CRISP_WEBSITE_ID = "cd4b8d92-3456-4c64-b34c-70e74e758f3f";

export default function CrispChat() {
  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {`window.$crisp=[];window.CRISP_WEBSITE_ID="${CRISP_WEBSITE_ID}";(function(){var d=document,s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
    </Script>
  );
}
