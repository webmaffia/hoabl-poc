/** Format a list of option labels into a natural spoken phrase: "A, B, or C". */
export function listToSpeech(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, or ${items[items.length - 1]}`;
}

/** Build a spoken line that includes both the question and its answer options. */
export function questionWithOptions(question: string, optionLabels: string[], multi = false): string {
  const optionsText = listToSpeech(optionLabels);
  if (!optionsText) return question;
  return multi
    ? `${question} You can pick up to a few: ${optionsText}.`
    : `${question} Your options are: ${optionsText}.`;
}
