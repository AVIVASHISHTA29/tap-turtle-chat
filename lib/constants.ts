export const EXAMPLE_QUERIES = [
  {
    label: "User Engagement",
    query:
      "Show me all the user interactions on the website by event and session",
  },
  {
    label: "Clicks Analysis",
    query:
      "Give me the top 10 most clicked elements on the website as a bar chart.",
  },
  {
    label: "Top Sessions",
    query: "Give me top 10 sessions with most user interactions",
  },
  {
    label: "Worst Sessions",
    query: "Give me top 10 sessions with least user interactions",
  },
  {
    label: "Device Usage",
    query: "What devices are people using to access the website?",
  },
  {
    label: "Browser Stats",
    query: "Show me the browser usage statistics",
  },
  {
    label: "Page Performance",
    query: "Show me the page performance metrics, by events and sessions",
  },
  {
    label: "Heatmap",
    query: "Show me the heatmap of user interactions",
  },
] as const;
