export const extractSlug = (link: string) => {
  const parts = link.split("/");
  return parts[parts.length - 1];
};
