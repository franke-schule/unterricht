const COMMIT_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);

/** Separates live range previews from one completed pointer/keyboard/AT change. */
export function createSliderCommitAdapter({ getValue, onPreview, onCommit, isRestoring = () => false }) {
  let baseline = getValue();
  let pointer = false;
  let keyboard = false;
  let cancelled = false;
  let suppressChange = false;

  function commit() {
    const value = getValue();
    if (value !== baseline && !isRestoring()) onCommit();
    baseline = value;
    suppressChange = true;
  }

  return {
    pointerdown() {
      pointer = true;
      cancelled = false;
      baseline = getValue();
      suppressChange = false;
    },
    input() {
      onPreview();
      if (!pointer && !keyboard) suppressChange = false;
      if (isRestoring()) baseline = getValue();
    },
    pointerup() {
      if (!pointer) return;
      pointer = false;
      if (!cancelled) commit();
    },
    pointercancel() {
      if (!pointer) return;
      pointer = false;
      cancelled = true;
      baseline = getValue();
      suppressChange = true;
    },
    keydown(event) {
      if (!COMMIT_KEYS.has(event.key)) return;
      if (!keyboard) baseline = getValue();
      keyboard = true;
      suppressChange = false;
    },
    keyup(event) {
      if (!keyboard || !COMMIT_KEYS.has(event.key)) return;
      keyboard = false;
      commit();
    },
    blur() {
      if (!keyboard) return;
      keyboard = false;
      commit();
    },
    change() {
      if (pointer || keyboard || suppressChange || isRestoring()) return;
      commit();
    },
  };
}
