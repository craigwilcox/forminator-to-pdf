import { kv } from "@vercel/kv";

export interface ColumnMapping {
  outputName: string;
  sourceIndex: number;
}

export interface TransformConfig {
  slug: string;
  title: string;
  description: string;
  columns: ColumnMapping[];
}

function kvKey(slug: string) {
  return `transform:${slug}`;
}

export async function getTransform(
  slug: string
): Promise<TransformConfig | null> {
  return kv.get<TransformConfig>(kvKey(slug));
}

export async function saveTransform(config: TransformConfig): Promise<void> {
  await kv.set(kvKey(config.slug), config);
}

export async function listTransforms(): Promise<string[]> {
  const keys = await kv.keys("transform:*");
  return keys.map((k) => k.replace("transform:", ""));
}
