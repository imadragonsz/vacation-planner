// Dynamic discovery of all images in the profilepictures folder
const avatarContext = (require as any).context(
  "../assets/profilepictures",
  false,
  /\.(png|jpe?g|svg)$/,
);

export const AVATAR_MAP: { [key: string]: string } = avatarContext
  .keys()
  .reduce((acc: any, key: string) => {
    // Extract filename without extension as slug (e.g. './bear.png' -> 'bear')
    const slug = key.replace("./", "").replace(/\.\w+$/, "");
    acc[slug] = avatarContext(key);
    return acc;
  }, {});

export const AVATAR_SLUGS = Object.keys(AVATAR_MAP).sort();

/**
 * Resolves an avatar source.
 * If the input is a known slug, returns the imported image path.
 * Otherwise returns the input as is (for backwards compatibility with old path strings or external URLs).
 */
export const resolveAvatar = (src: string | null | undefined): string => {
  if (!src) return "";
  if (AVATAR_MAP[src]) return AVATAR_MAP[src];
  return src;
};
