@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.5rem;
  /* CHOSEN ONE — red + white (sportswear premium) */
  --background: oklch(0.99 0 0);              /* pure white */
  --foreground: oklch(0.14 0.005 20);         /* near-black */
  --card: oklch(1 0 0);                        /* white card */
  --card-foreground: oklch(0.14 0.005 20);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.14 0.005 20);
  --primary: oklch(0.55 0.22 27);             /* bold red */
  --primary-foreground: oklch(0.99 0 0);      /* white */
  --secondary: oklch(0.96 0.005 20);          /* light grey */
  --secondary-foreground: oklch(0.14 0.005 20);
  --muted: oklch(0.96 0.005 20);
  --muted-foreground: oklch(0.45 0.01 20);
  --accent: oklch(0.96 0.01 20);
  --accent-foreground: oklch(0.14 0.005 20);
  --destructive: oklch(0.55 0.22 27);
  --border: oklch(0.90 0.005 20);
  --input: oklch(0.92 0.005 20);
  --ring: oklch(0.55 0.22 27);
  --chart-1: oklch(0.55 0.22 27);
  --chart-2: oklch(0.65 0.20 25);
  --chart-3: oklch(0.45 0.18 30);
  --chart-4: oklch(0.75 0.15 22);
  --chart-5: oklch(0.50 0.20 28);
  --sidebar: oklch(0.98 0.005 20);
  --sidebar-foreground: oklch(0.14 0.005 20);
  --sidebar-primary: oklch(0.55 0.22 27);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.96 0.005 20);
  --sidebar-accent-foreground: oklch(0.14 0.005 20);
  --sidebar-border: oklch(0.90 0.005 20);
  --sidebar-ring: oklch(0.55 0.22 27);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "ss01", "cv01";
  }
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: oklch(0.96 0.005 20);
  }
  ::-webkit-scrollbar-thumb {
    background: oklch(0.80 0.01 20);
    border-radius: 5px;
    border: 2px solid oklch(0.96 0.005 20);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: oklch(0.55 0.22 27);
  }
}

/* ===== CHOSEN ONE custom utilities ===== */

.font-stencil {
  font-family: var(--font-geist-sans);
  letter-spacing: -0.04em;
  font-weight: 900;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}

@keyframes slow-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-slow-spin {
  animation: slow-spin 40s linear infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.animate-glow-pulse {
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes draw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}
.animate-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw 0.8s ease-out forwards;
}

.grain-overlay {
  position: relative;
}
.grain-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

::selection {
  background: oklch(0.55 0.22 27);
  color: oklch(0.99 0 0);
}
