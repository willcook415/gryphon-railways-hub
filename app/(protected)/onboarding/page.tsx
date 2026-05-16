import { FeaturePlaceholder } from "@/components/feature-page";

export default function OnboardingPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Team setup"
      title="Onboarding"
      description="Guide new members through access, safety, documents, and subteam expectations."
      cards={[
        {
          title: "Member steps",
          description: "A guided checklist for new Gryphon Railways members.",
          meta: "Future flow",
        },
        {
          title: "Safety induction",
          description: "Required documents and acknowledgement status.",
        },
        {
          title: "Sub-team handoff",
          description: "Ownership notes for leads and mentors.",
        },
      ]}
    />
  );
}
