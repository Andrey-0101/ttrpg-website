export type CharacterEditorKeyDownContext = {
  key: string;
  isComposing: boolean;
  targetTagName: string;
  targetType?: string;
};

export function shouldPreventImplicitCharacterSave({
  key,
  isComposing,
  targetTagName,
  targetType = "",
}: CharacterEditorKeyDownContext): boolean {
  if (key !== "Enter" || isComposing || targetTagName !== "INPUT") {
    return false;
  }

  return !["button", "reset", "submit"].includes(targetType.toLowerCase());
}
