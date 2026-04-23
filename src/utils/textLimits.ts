export const TEXT_LIMITS = {
  SHORT: 50, // Names, titles, small inputs
  MEDIUM: 255, // Summaries, locations, addresses
  LONG: 2000, // Descriptions, notes, long-form text
};

export const truncateText = (text: string, limit: number) => {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
};
