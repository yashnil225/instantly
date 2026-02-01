import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "Instantly",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Cold email outreach and marketing automation platform. Scale your outreach with unlimited accounts and AI-powered warmup.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "instantly-ai.vercel.app",
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "dark",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#3b82f6",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/login",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignIn.js
    callbackUrl: "/analytics",
  },
} as ConfigProps;

export default config;
