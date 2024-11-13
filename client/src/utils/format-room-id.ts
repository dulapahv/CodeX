export const formatRoomId = (value: string) => {
  // Remove any non-alphanumeric characters
  const cleaned = value.replace(/[^A-Z0-9]/g, '');

  // Limit to 8 characters
  const truncated = cleaned.slice(0, 8);

  // Add dash after first 4 characters if length > 4
  if (truncated.length > 4) {
    return `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
  }

  return truncated;
};
