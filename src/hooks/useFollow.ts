import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface FollowItem {
  slug: string;
  title: string;
  cover: string;
  latestChapter: {
    title: string;
  };
  lastReadAt?: string;
}

export const useFollow = () => {
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        const q = query(collection(db, "follows"), where("uid", "==", user.uid));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const followsData: FollowItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            followsData.push({
              slug: data.slug,
              title: data.title,
              cover: data.cover,
              latestChapter: {
                title: data.latestChapter.title,
              },
              lastReadAt: data.lastReadAt,
            });
          });
          setFollows(followsData);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setFollows([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const follow = async (item: Omit<FollowItem, "lastReadAt"> & Partial<Pick<FollowItem, "lastReadAt">>) => {
    if (!auth.currentUser) return;
    const docId = `${auth.currentUser.uid}_${item.slug}`;
    await setDoc(doc(db, "follows", docId), {
      ...item,
      uid: auth.currentUser.uid,
      lastReadAt: item.lastReadAt || new Date().toISOString(),
    });
  };

  const unfollow = async (slug: string) => {
    if (!auth.currentUser) return;
    const docId = `${auth.currentUser.uid}_${slug}`;
    await deleteDoc(doc(db, "follows", docId));
    setFollows((prev) => prev.filter((item) => item.slug !== slug));
  };

  const updateLastReadTime = async (slug: string) => {
    if (!auth.currentUser) return;
    const docId = `${auth.currentUser.uid}_${slug}`;
    const lastReadAt = new Date().toISOString();
    await setDoc(
      doc(db, "follows", docId),
      { lastReadAt },
      { merge: true }
    );
    setFollows((prev) =>
      prev.map((item) =>
        item.slug === slug ? { ...item, lastReadAt } : item
      )
    );
  };

  const isFollowed = (slug: string): boolean => {
    return follows.some((item) => item.slug === slug);
  };

  return { follows, isLoading, isLoggedIn, follow, unfollow, updateLastReadTime, isFollowed };
};
