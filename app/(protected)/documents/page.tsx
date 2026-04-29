import { FeaturePlaceholder } from "@/components/feature-page";

export default function DocumentsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Controlled docs"
      title="Documents"
      description="Keep procedures, safety files, method statements, and competition documents organised for the team."
      cards={[
        {
          title: "Document library",
          description: "Categorised files and latest approved versions.",
          meta: "Storage later",
        },
        {
          title: "Acknowledgements",
          description: "Track members who need to confirm safety documents.",
        },
        {
          title: "Review queue",
          description: "Upcoming reviews, owners, and approval status.",
        },
      ]}
    />
  );
}
