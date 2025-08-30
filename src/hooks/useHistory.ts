import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

export interface HistoryItem {
  slug: string;
  title: string;
  cover: string;
  chapter: string;
  chaptersRead: string[];
  readAt: string;
}

export const useHistory = () => {
  const [deviceHistory, setDeviceHistory] = useState<HistoryItem[]>([]);
  const [accountHistory, setAccountHistory] = useState<HistoryItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedDeviceHistory = localStorage.getItem("deviceHistory");
    if (storedDeviceHistory) {
      try {
        setDeviceHistory(JSON.parse(storedDeviceHistory));
      } catch {
        setDeviceHistory([]);
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAccountHistory(data.readingHistory || []);
          } else {
            setAccountHistory([]);
          }
          setIsLoading(false);
        });
        return () => unsubscribeFirestore();
      } else {
        setAccountHistory([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addChapter = async (item: Omit<HistoryItem, "readAt">) => {
    const newItem: HistoryItem = {
      ...item,
      readAt: new Date().toISOString(),
      chaptersRead: item.chaptersRead || [],
    };

    if (isLoggedIn && auth.currentUser) {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      let updatedHistory = docSnap.exists() ? (docSnap.data().readingHistory || []) : [];
      const existingItem = updatedHistory.find((h: HistoryItem) => h.slug === item.slug);
      if (existingItem) {
        if (!existingItem.chaptersRead.includes(item.chapter)) {
          existingItem.chaptersRead = Array.from(new Set([...existingItem.chaptersRead, item.chapter]));
        }
        existingItem.readAt = newItem.readAt;
        existingItem.chapter = item.chapter;
      } else {
        updatedHistory.push(newItem);
      }
      await setDoc(docRef, { readingHistory: updatedHistory }, { merge: true });
      setAccountHistory(updatedHistory);
    } else {
      setDeviceHistory((prev) => {
        let updated = [...prev];
        const existingItem = updated.find((h) => h.slug === item.slug);
        if (existingItem) {
          if (!existingItem.chaptersRead.includes(item.chapter)) {
            existingItem.chaptersRead = Array.from(new Set([...existingItem.chaptersRead, item.chapter]));
          }
          existingItem.readAt = newItem.readAt;
          existingItem.chapter = item.chapter;
        } else {
          updated.push(newItem);
        }
        localStorage.setItem("deviceHistory", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const remove = async (slug: string, type: "device" | "account") => {
    if (type === "device") {
      setDeviceHistory((prev) => {
        const updated = prev.filter((h) => h.slug !== slug);
        localStorage.setItem("deviceHistory", JSON.stringify(updated));
        return updated;
      });
      const sessionData = JSON.parse(sessionStorage.getItem("sessionReadChapters") || "{}");
      delete sessionData[slug];
      sessionStorage.setItem("sessionReadChapters", JSON.stringify(sessionData));
    } else if (type === "account" && isLoggedIn && auth.currentUser) {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentHistory = docSnap.data().readingHistory || [];
        const updatedHistory = currentHistory.filter((h: HistoryItem) => h.slug !== slug);
        await setDoc(docRef, { readingHistory: updatedHistory }, { merge: true });
        setAccountHistory(updatedHistory);
      }
    }
  };

  return {
    deviceHistory,
    accountHistory,
    isLoggedIn,
    isLoading,
    addChapter,
    remove,
  };
};
