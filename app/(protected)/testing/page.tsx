import { FeaturePlaceholder } from "@/components/feature-page";

export default function TestingPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Validation"
      title="Testing"
      description="Plan and record bench tests, track sessions, observations, and vehicle configuration changes."
      cards={[
        {
          title: "Upcoming schedule",
          description: "Mobile-ready cards for test plans and attendance.",
          meta: "Planning",
        },
        {
          title: "Run notes",
          description: "Structured observations and linked faults.",
        },
        {
          title: "Test readiness",
          description: "Pre-run checks before teams leave the workshop.",
        },
      ]}
    />
  );
}
