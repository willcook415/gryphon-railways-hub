import { FeaturePlaceholder } from "@/components/feature-page";

export default function TelemetryPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Vehicle data"
      title="Telemetry"
      description="Surface telemetry sessions, event markers, faults, and test context once the data pipeline is connected."
      cards={[
        {
          title: "Session list",
          description: "Recent sessions and associated test runs.",
          meta: "Pipeline later",
        },
        {
          title: "Event markers",
          description: "Fault, safety, warning, and run marker events.",
        },
        {
          title: "Configuration context",
          description: "Vehicle setup and track conditions for analysis.",
        },
      ]}
    />
  );
}
