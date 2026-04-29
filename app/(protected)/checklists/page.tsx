import { FeaturePlaceholder } from "@/components/feature-page";

export default function ChecklistsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Readiness"
      title="Checklists"
      description="Reusable operational checklists for competition, testing, safety, and onboarding workflows."
      cards={[
        {
          title: "Competition readiness",
          description: "High-level readiness checklist for key deadlines.",
          meta: "Skeleton",
        },
        {
          title: "Safety checks",
          description: "Repeatable checks for workshop and testing activity.",
        },
        {
          title: "Assigned items",
          description: "Subteam ownership and blocked items.",
        },
      ]}
    />
  );
}
