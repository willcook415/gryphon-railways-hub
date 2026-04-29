import { FeaturePlaceholder } from "@/components/feature-page";

export default function FaultsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Issue control"
      title="Faults"
      description="Track reported faults, blockers, corrective actions, and verification status across the rail vehicle programme."
      cards={[
        {
          title: "Fault register",
          description: "A filtered register of active and resolved faults.",
          meta: "Coming next",
        },
        {
          title: "Critical blockers",
          description: "Escalations for issues affecting safety or testing.",
        },
        {
          title: "Closure evidence",
          description: "Verification notes and responsible owners.",
        },
      ]}
    />
  );
}
