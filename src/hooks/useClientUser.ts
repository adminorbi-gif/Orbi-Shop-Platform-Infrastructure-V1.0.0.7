import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/db";
import { getLoyaltyPoints } from "../lib/helpers";

export function useClientUser(getInitialUserId: () => string) {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [guestMessages, setGuestMessages] = useState<any[]>([]);
  const [pPoints, setPPoints] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("Orbishop_customers");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setActiveUser(u);
      } catch (e) {
        localStorage.removeItem("Orbishop_customers");
      }
    }
  }, []);

  const fetchGuestMsgs = useCallback(async () => {
    if (!activeUser) {
      setGuestMessages([]);
      return;
    }
    try {
      const all = await db.getMessages();
      const userMsgs = all.filter((m: any) => {
        const isSameCustomer = m.customerId === activeUser.id || m.customer_id === activeUser.id;
        if (isSameCustomer) return true;
        if (!m.phone || !activeUser.phone) return false;
        const cp1 = m.phone.replace(/\D/g, "");
        const cp2 = activeUser.phone.replace(/\D/g, "");
        if (cp1.length >= 9 && cp2.length >= 9) {
          return cp1.slice(-9) === cp2.slice(-9);
        }
        return cp1 === cp2;
      });
      setGuestMessages(userMsgs);
    } catch (err) {
      console.warn("Error loading customer messages:", err);
    }
  }, [activeUser]);

  useEffect(() => {
    fetchGuestMsgs();
    const interval = setInterval(fetchGuestMsgs, 15000);
    return () => clearInterval(interval);
  }, [fetchGuestMsgs]);

  const updatePoints = useCallback(() => {
    const userId = activeUser ? activeUser.id : getInitialUserId();
    const points = getLoyaltyPoints(userId);
    setPPoints(points);
  }, [activeUser, getInitialUserId]);

  useEffect(() => {
    updatePoints();
  }, [updatePoints]);

  const logoutClient = () => {
    localStorage.removeItem("Orbishop_customers");
    setActiveUser(null);
  };

  return {
    activeUser,
    setActiveUser,
    guestMessages,
    setGuestMessages,
    pPoints,
    setPPoints,
    logoutClient,
    updatePoints,
    fetchGuestMsgs
  };
}
