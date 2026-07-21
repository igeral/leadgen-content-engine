// Demo-mode sample posts (used when no API key is set). Illustrative only:
// these are NOT real build reports and must never be posted as first-person
// experience. Live generation writes Build Log posts from real pasted notes.
export const MOCK_POSTS = {
  linkedin: {
    'Build Log': [
      "The pipeline ran clean for three days.\n\nThen the source added a column and my bronze layer swallowed it silently.\n\nNo error. No alert. Just a silver table quietly missing a field the dashboard was about to need.\n\nWhat fixed it:\n→ Schema evolution turned on explicitly, not assumed\n→ An expectation on column count, not just null checks\n→ A cheap daily diff between source and bronze schemas\n\nThe lesson I keep relearning: pipelines rarely fail loudly. They drift.\n\nIf you would have caught this a different way, I want to hear it.\n\n#DataEngineering #Databricks #Lakehouse",
    ],
    'Architecture Patterns': [
      "Most teams do not have a compute cost problem.\n\nThey have a boundary problem.\n\nWhen bronze, silver, and gold all live in one notebook that runs end to end, every small change reprocesses everything. The bill is a symptom. The architecture is the cause.\n\nWhat actually helps:\n→ Layer boundaries that are real jobs, not cell dividers\n→ Incremental reads at every hop\n→ Gold tables that serve one consumer well instead of five badly\n\nThe trade-off is honest: more moving parts to orchestrate, more places to look when something breaks.\n\nWorth it past a certain scale. Overkill before it.\n\nWhat does your stack do instead?\n\n#DataArchitecture #Lakehouse #AnalyticsEngineering",
    ],
    'Ecosystem News': [
      "Every release post says the same thing: this changes everything.\n\nMost of the time it changes one thing, and only for teams already set up to use it.\n\nThe question I ask before caring about a new feature:\n\nDoes this remove work I am currently doing, or does it add a capability I would then have to maintain?\n\nBoth can be worth it. They are not the same decision, and treating them the same is how platforms sprawl.\n\nCurious whether people running this in production read it differently.\n\n#DataEngineering #Databricks #DataPlatform",
    ],
    'Platform Deep Dives': [
      "Genie spaces get explained as \"ask your data questions in plain English.\"\n\nThat undersells the part that actually matters.\n\nThe quality of the answer is set long before the question gets asked. It is set by how well the underlying tables are named, described, and governed.\n\nA clean semantic layer makes it look like magic.\nA messy one makes it look like a toy.\n\nSame feature. Completely different outcome.\n\nIf you have shipped one to real business users, what did you have to fix first?\n\n#Databricks #DataGovernance #AnalyticsEngineering",
    ],
    'Use Case Breakdowns': [
      "Published case studies all skip the boring part, which is the only part that transfers.\n\nNot the model. Not the dashboard. The ingestion contract.\n\nEvery lakehouse story that actually held up had the same unglamorous foundation: a defined schema agreement with the source system, and a plan for what happens when the source breaks it.\n\nThe industry changes. That requirement does not.\n\nWhich industry or dataset should I break down next?\n\n#DataEngineering #Lakehouse #DataStrategy",
    ],
    'Career & Craft': [
      "Eight years in analytics engineering and the most useful thing I learned had nothing to do with a tool.\n\nIt was this: the dashboard is never the deliverable.\n\nThe decision it changes is the deliverable.\n\nI spent an early year building beautiful reports nobody opened twice. Not because the SQL was wrong, but because I never asked what action the number was supposed to trigger.\n\nNow the first question is always: if this metric moves, what do you do differently?\n\nIf the answer is nothing, we do not build it.\n\nWhat is the lesson that changed how you work?\n\n#AnalyticsEngineering #DataCareers #BI",
    ],
  },
  facebook: {
    'Build Log': [
      "Spent the weekend pointing a public dataset at a lakehouse pipeline just to see where it would break.\n\nIt broke exactly where the docs said it would not.\n\nWriting up what happened, including the part where I was wrong about the fix.\n\n#DataEngineering",
    ],
  },
};
