import { notFound } from "next/navigation";
import { getTransform } from "@/lib/transforms";
import { SlugConverter } from "./slug-converter";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const config = await getTransform(slug);
  if (!config) {
    notFound();
  }

  return (
    <SlugConverter
      slug={config.slug}
      title={config.title}
      description={config.description}
    />
  );
}
