export const THEMES = [
  {
    key: "light",
    name: "Light",
    description: "Clean and bright for daytime use",
    colorScheme: "light",
    colors: ["#ffffff", "#f1f1f1", "#3b82f6"],
  },
  {
    key: "dark",
    name: "Dark",
    description: "Low-glare contrast for late-night focus",
    colorScheme: "dark",
    colors: ["#151311", "#201d1a", "#8a7562"],
  },
  {
    key: "avocado",
    name: "Avocado",
    description: "Soft green tones with a calm workspace feel",
    colorScheme: "light",
    colors: ["#f6f8f3", "#d6e0c8", "#6b8e23"],
  },
  {
    key: "sunset",
    name: "Sunset",
    description: "Warm, moody reds with cozy contrast",
    colorScheme: "dark",
    colors: ["#2a1818", "#5a2e2e", "#ff6b6b"],
  },
  {
    key: "ocean",
    name: "Ocean",
    description: "Deep blue layers with a crisp sea-breeze accent",
    colorScheme: "dark",
    colors: ["#0f1f2e", "#1d3447", "#38bdf8"],
  },
  {
    key: "graphite",
    name: "Graphite",
    description: "Charcoal neutrals with polished steel highlights",
    colorScheme: "dark",
    colors: ["#17191d", "#242830", "#94a3b8"],
  },
  {
    key: "rose",
    name: "Rose",
    description: "Soft blush surfaces with elegant rosy accents",
    colorScheme: "light",
    colors: ["#fff7f8", "#fdecef", "#e8798f"],
  },
  {
    key: "mint",
    name: "Mint",
    description: "Fresh aqua greens with clean, airy contrast",
    colorScheme: "light",
    colors: ["#f4fffb", "#ddf7ee", "#14b8a6"],
  },
  {
    key: "amber",
    name: "Amber",
    description: "Warm sand tones with honey-colored highlights",
    colorScheme: "light",
    colors: ["#fffaf0", "#f7e8c7", "#d97706"],
  },
];

export const DEFAULT_THEME_KEY = "light";

export const THEME_MAP = Object.fromEntries(
  THEMES.map((theme) => [theme.key, theme]),
);
