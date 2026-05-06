export const FEEDBACK_TYPES = [
  { value: "general_experience", label: "General Experience", emoji: "⭐", color: "bg-amber-100 text-amber-800" },
  { value: "bug_report", label: "Bug Report", emoji: "🐛", color: "bg-red-100 text-red-800" },
  { value: "feature_request", label: "Feature Request", emoji: "💡", color: "bg-yellow-100 text-yellow-800" },
  { value: "design_feedback", label: "Design Feedback", emoji: "🎨", color: "bg-purple-100 text-purple-800" },
  { value: "service_quality", label: "Service Quality", emoji: "📦", color: "bg-blue-100 text-blue-800" },
  { value: "compliment", label: "Compliment", emoji: "🙏", color: "bg-emerald-100 text-emerald-800" },
  { value: "other", label: "Other", emoji: "💬", color: "bg-slate-100 text-slate-800" },
] as const;

export type FeedbackTypeValue = typeof FEEDBACK_TYPES[number]["value"];

export const getFeedbackTypeMeta = (value: string) =>
  FEEDBACK_TYPES.find((t) => t.value === value) ?? FEEDBACK_TYPES[FEEDBACK_TYPES.length - 1];

export const FEEDBACK_STATUSES = [
  { value: "new", label: "New", color: "bg-red-100 text-red-800" },
  { value: "reviewed", label: "Reviewed", color: "bg-yellow-100 text-yellow-800" },
  { value: "resolved", label: "Resolved", color: "bg-emerald-100 text-emerald-800" },
] as const;

export const getFeedbackStatusMeta = (value: string) =>
  FEEDBACK_STATUSES.find((s) => s.value === value) ?? FEEDBACK_STATUSES[0];