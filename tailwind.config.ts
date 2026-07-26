import type { Config } from "tailwindcss";

// Every color maps to a CSS variable so the whole UI re-themes instantly.
// Channels are stored as "R G B" triplets (see globals.css) so Tailwind opacity
// modifiers keep working: bg-primary/10 → rgb(var(--c-primary) / 0.1).
const ch = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: ch("primary"),
        "primary-hover": ch("primary-hover"),
        secondary: ch("secondary"),
        ink: ch("text-primary"), // texte principal
        muted: ch("text-secondary"), // texte secondaire / labels
        faint: ch("text-muted"), // placeholders, metadata
        line: ch("border"), // bordures filaires
        "line-strong": ch("border-strong"),
        canvas: ch("app"), // fond d'app
        surface: ch("surface"), // cartes / panneaux
        "surface-hover": ch("surface-hover"),
        panel: ch("sidebar"), // fond sidebar
        rail: ch("rail"), // rail d'outils
        success: ch("success"),
        danger: ch("danger"),
        warning: ch("warning"),
        info: ch("info"),
        "signal-hot": ch("signal-hot"),
        "signal-hot-bg": ch("signal-hot-bg"),
        "signal-warm": ch("signal-warm"),
        "signal-warm-bg": ch("signal-warm-bg"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "var(--color-gradient)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        soft: "var(--shadow-md)",
        card: "var(--shadow-card)",
        pop: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
