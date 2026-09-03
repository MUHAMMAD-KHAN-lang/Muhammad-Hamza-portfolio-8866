/* ============================================================================
   SITE CONFIGURATION — SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------------------
   Everything you are ever likely to change lives in this file.
   Edit here; do not edit values scattered through the HTML.
   ========================================================================== */

const SITE_CONFIG = {
  /* --- Identity ------------------------------------------------------- */
  name: "Engineer Muhammad Hamza",
  shortName: "Muhammad Hamza",
  specialization: "Control Systems & Engineering System Design",
  domain: "UAV / UAS / Drone Engineering",
  tagline: "Model. Design. Integrate. Control. Optimize.",

  /* --- Brand ---------------------------------------------------------- */
  // The monogram carries all three letters in one square figure:
  //   H = the two full-height rails + the bar between them
  //   M = the chevron dropping between the rails
  //   E = the left rail + the three arms stepping off it
  // Assets and usage rules: assets/branding/README.md
  brand: {
    mark:      "assets/branding/emh-mark.svg",       // currentColor, for inline use
    light:     "assets/branding/emh-logo-light.svg", // graphite, for ivory grounds
    dark:      "assets/branding/emh-logo-dark.svg",  // ivory, for graphite grounds
    accent:    "assets/branding/emh-logo-accent.svg",
    favicon:   "assets/branding/favicon.svg",
    ogImage:   "assets/branding/og-cover.png",
    graphite:  "#171614",
    ivory:     "#F5F1EA",
    copper:    "#C2683A",
    copperUp:  "#E0894F",
    copperDeep:"#8A4A2A"
  },

  /* --- GitHub --------------------------------------------------------- */
  // The ONLY place the GitHub username is defined.
  githubUsername: "MUHAMMAD-KHAN-lang",
  repoName: "Muhammad-Hamza-portfolio-8866",

  /* --- Public URLs ---------------------------------------------------- */
  siteUrl: "https://MUHAMMAD-KHAN-lang.github.io/Muhammad-Hamza-portfolio-8866/",

  /* --- Contact -------------------------------------------------------- */
  email: "MuhammadKhan90876@gmail.com",
  whatsapp: "923020198866",          // international format, digits only
  whatsappDisplay: "+92 302 0198866",

  // Leave as an empty string until a real profile URL is available.
  // An empty value renders a neutral "not yet published" state — it never
  // renders a broken or invented link.

  /* --- Documents ------------------------------------------------------ */
  // Drop the PDF at this path and the Download CV buttons start working.
  /* Experience is derived from these two start points at page load — never
     typed into the markup. A bare year is treated as 1 January of that year,
     so the count rolls over with the calendar. Supply a full "YYYY-MM-DD"
     instead if the figure should turn on an exact anniversary. */
  /* Used only to compute the age shown on the profile page. The date itself
     is never rendered. */
  dateOfBirth: "2004-05-20",

  practicalExperienceStartDate: "2024",
  technicalDevelopmentStartDate: "2020",

  cvPath: "assets/documents/Muhammad_Hamza_CV.pdf"
};

/* ============================================================================
   PROJECT DISCOVERY CONFIGURATION
   ----------------------------------------------------------------------------
   Controls which public repositories are surfaced on the Projects section and
   how they are ranked. You control your portfolio from GitHub itself by adding
   repository topics — you never edit this website to publish a new project.
   ========================================================================== */

const PROJECT_CONFIG = {
  /* Add this topic to a repository to force it to the top as a headline
     project, regardless of its other topics. */
  featuredTopic: "portfolio-featured",

  /* Add either of these topics to a repository to guarantee it appears,
     even if it carries no other engineering topic. */
  portfolioTopics: ["portfolio", "engineering-portfolio"],

  /* Engineering topics. A repository carrying any of these is treated as a
     genuine engineering project and displayed. Extend this list freely. */
  engineeringTopics: [
    "uav", "uas", "drone", "drones", "quadcopter", "multirotor", "flight-control",
    "control-systems", "control-theory", "control-engineering", "pid", "state-space",
    "kalman-filter", "dynamics", "modeling", "modelling", "simulation", "matlab",
    "simulink", "systems-engineering", "aerospace", "avionics", "navigation",
    "embedded", "embedded-systems", "microcontroller", "stm32", "arduino", "esp32",
    "firmware", "rtos", "electronics", "pcb", "sensors", "actuators",
    "robotics", "ros", "ros2", "autonomous-systems", "path-planning",
    "antenna", "antennas", "rf", "wireless", "communication", "telemetry",
    "cad", "3d-modeling", "solidworks", "fusion360", "mechanical-design",
    "optimization", "numerical-methods", "scientific-computing", "linear-algebra",
    "reinforcement-learning", "machine-learning", "computer-vision",
    "python", "cpp", "c", "c-plus-plus", "engineering"
  ],

  /* Fallback keyword matching on name + description, used when a repository
     has no topics at all. Keeps good work from being hidden by an oversight. */
  engineeringKeywords: [
    "uav", "uas", "drone", "quadcopter", "flight", "control", "pid", "kalman",
    "dynamics", "model", "simulation", "simulate", "embedded", "firmware",
    "microcontroller", "stm32", "arduino", "esp32", "sensor", "actuator",
    "robot", "antenna", "rf", "wireless", "telemetry", "cad", "mechanical",
    "optimis", "optimiz", "numerical", "matrix", "solver", "aerospace",
    "avionic", "navigation", "estimator", "observer", "trajectory"
  ],

  /* Repositories to never display (exact names, case-insensitive). The
     portfolio repository itself and the GitHub profile repository are
     excluded automatically. */
  excludeRepos: [],

  /* Display behaviour */
  hideForks: true,
  hideArchived: false,      // archived work still counts as engineering work
  showUnclassified: false,  // repositories with no engineering signal are
                            // hidden behind the "Show all repositories" toggle
  maxFeatured: 3,
  perPage: 100
};

/* Domain labels shown on each project card, resolved from repository topics
   and language. First match wins, so order matters — most specific first. */
const DOMAIN_RULES = [
  { label: "UAV / UAS",        match: ["uav", "uas", "drone", "drones", "quadcopter", "multirotor", "flight-control", "avionics", "aerospace"] },
  { label: "Control Systems",  match: ["control-systems", "control-theory", "control-engineering", "pid", "state-space", "kalman-filter", "observer"] },
  { label: "Robotics",         match: ["robotics", "ros", "ros2", "autonomous-systems", "path-planning"] },
  { label: "Embedded Systems", match: ["embedded", "embedded-systems", "microcontroller", "stm32", "arduino", "esp32", "firmware", "rtos"] },
  { label: "Electronics",      match: ["electronics", "pcb", "sensors", "actuators", "circuit"] },
  { label: "Communications",   match: ["antenna", "antennas", "rf", "wireless", "communication", "telemetry"] },
  { label: "Modeling & Simulation", match: ["simulation", "modeling", "modelling", "dynamics", "matlab", "simulink"] },
  { label: "CAD & 3D Design",  match: ["cad", "3d-modeling", "solidworks", "fusion360", "mechanical-design"] },
  { label: "Computational Engineering", match: ["optimization", "numerical-methods", "scientific-computing", "linear-algebra", "machine-learning", "reinforcement-learning", "computer-vision"] },
  { label: "Systems Engineering", match: ["systems-engineering", "requirements", "architecture"] }
];

/* Exported for the browser. No build step, no bundler, no dependencies. */
window.SITE_CONFIG = SITE_CONFIG;
window.PROJECT_CONFIG = PROJECT_CONFIG;
window.DOMAIN_RULES = DOMAIN_RULES;
