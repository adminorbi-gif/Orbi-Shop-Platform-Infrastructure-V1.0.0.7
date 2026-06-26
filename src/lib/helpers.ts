export const getLoyaltyPoints = (userId: string) => {
  const pointsKey = "orbishop_loyalty_points_" + userId;
  const stored = localStorage.getItem(pointsKey);
  if (stored === null) {
    // Welcome gift of 150 points for first-time login
    localStorage.setItem(pointsKey, "150");
    return 150;
  }
  return parseInt(stored, 10) || 0;
};

export const saveLoyaltyPoints = (userId: string, points: number) => {
  localStorage.setItem("orbishop_loyalty_points_" + userId, points.toString());
};

export const formatOrderNumber = (order: any) => {
  return order.id ? order.id.substring(0, 8).toUpperCase() : "";
};

export const getOrderNumber = (orderId: string): string => {
  if (!orderId) return "";
  const parts = orderId.split("-");
  if (parts.length > 0 && parts[0].length >= 4) {
    return parts[0].toUpperCase();
  }
  const clean = orderId.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 8) {
    return clean.substring(0, 8).toUpperCase();
  }
  return orderId.toUpperCase();
};
