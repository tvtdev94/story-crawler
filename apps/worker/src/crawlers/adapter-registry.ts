import type { CrawlerAdapter } from "./adapter-interface";
import { mockFixtureAdapter } from "./mock-fixture-adapter";
import { gutenbergViAdapter } from "./gutenberg-vi-adapter";
import { metadataOnlyDemoAdapter } from "./metadata-only-demo-adapter";

const REGISTRY = new Map<string, CrawlerAdapter>([
  [mockFixtureAdapter.key, mockFixtureAdapter],
  [gutenbergViAdapter.key, gutenbergViAdapter],
  [metadataOnlyDemoAdapter.key, metadataOnlyDemoAdapter],
]);

export function getAdapter(key: string): CrawlerAdapter | undefined {
  return REGISTRY.get(key);
}

export function listAdapterKeys(): string[] {
  return [...REGISTRY.keys()];
}
