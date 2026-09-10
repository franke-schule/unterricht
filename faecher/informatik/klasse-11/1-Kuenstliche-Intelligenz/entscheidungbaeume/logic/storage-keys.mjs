import { VARIANTS } from "../data/monkeys.mjs";

export const TREE_STORAGE_PREFIX = "informatik11-decision-tree-v1";
export const VERIFIED_STORAGE_PREFIX = "informatik11-decision-tree-verified-v1";
export const TEST_RUN_STORAGE_PREFIX = "informatik11-decision-tree-test-v1";
export const COMPARISON_STORAGE_PREFIX = "informatik11-decision-tree-comparison-v2";

function versionSuffix(variant) {
  return variant.datasetVersion > 1 ? `-data-v${variant.datasetVersion}` : "";
}

export function variantStorageKey(prefix, variantId) {
  const variant = VARIANTS[variantId];
  if (!variant) throw new Error(`Unbekannte Variante: ${variantId}`);
  return `${prefix}-${variantId}${versionSuffix(variant)}`;
}

export function comparisonStorageKey() {
  return `${COMPARISON_STORAGE_PREFIX}${versionSuffix(VARIANTS.easy)}`;
}
