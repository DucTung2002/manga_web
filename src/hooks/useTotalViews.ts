import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useTotalViews = (truyenSlug: string | undefined) => {
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViews = async () => {
      if (!truyenSlug || truyenSlug.trim() === "") {
        setTotalViews(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      const total = await getTotalViews(truyenSlug);
      setTotalViews(total);
      setError(null);
      setIsLoading(false);
    };

    fetchViews();
  }, [truyenSlug]);

  return { totalViews, isLoading, error };
};

// Hàm lấy tổng views tất cả chapter (dùng ở Home hoặc preload)
export const getTotalViews = async (slug: string): Promise<number> => {
  const chaptersRef = collection(db, "comics", slug, "chapters");
  const snapshot = await getDocs(chaptersRef);

  let sum = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (typeof data.views === "number") {
      sum += data.views;
    }
  });

  return sum;
};
