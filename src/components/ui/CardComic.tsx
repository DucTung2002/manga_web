import { Link } from "react-router-dom";
import { Eye, Heart } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  title: string;
  cover: string;
  chapters: { title: string; time?: string }[];
  likes?: number;
  slug?: string;
  updated_at: string;
  totalViews?: number;
  genres?: string[] | null;
  status?: string | null;
  description?: string | null;
  other_name?: string | null;
  useTooltipOnly?: boolean;
};

export const CardComic = ({
  title,
  cover,
  chapters,
  likes = 0,
  slug,
  totalViews = 0,
  genres = null,
  status = null,
  description = null,
  other_name = null,
  useTooltipOnly = false,
}: Props) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const hideTimeoutRef = useRef<number | null>(null);

  const [extraInfo, setExtraInfo] = useState({
    genres,
    status,
    description,
    other_name,
  });

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const preloadData = async () => {
      if (!slug) return;
      try {
        const docRef = doc(db, "comics", slug);
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setExtraInfo({
            genres: data.genres ?? genres,
            status: data.status ?? status,
            description: data.description ?? description,
            other_name: data.other_name ?? other_name,
          });
        }
      } catch (err) {
      }
    };

    preloadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleTitleEnter = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>
  ) => {
    if (useTooltipOnly) return;

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const cardElement = (e.currentTarget as HTMLElement).closest(
      ".card-truyen"
    ) as HTMLElement;
    if (!cardElement) return;

    const rect = cardElement.getBoundingClientRect();
    const popupWidth = 400;
    const margin = 10;

    let posX = rect.right + margin;
    if (posX + popupWidth > window.innerWidth) {
      posX = rect.left - popupWidth - margin;
    }

    setPopupPosition({
      x: posX,
      y: rect.top,
    });

    setShowPopup(true);
  };

  const scheduleHide = (delay = 200) => {
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowPopup(false);
      hideTimeoutRef.current = null;
    }, delay);
  };

  const handleTitleLeave = () => {
    if (useTooltipOnly) return;
    scheduleHide(200);
  };

  const handlePopupEnter = () => {
    if (useTooltipOnly) return;
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowPopup(true);
  };

  const handlePopupLeave = () => {
    if (useTooltipOnly) return;
    scheduleHide(200);
  };

  const updatedAtDisplay = chapters.length > 0 ? chapters[0].time || "" : "";

  const titleElement = useTooltipOnly ? (
    <h3
      className="text-sm font-semibold text-gray-800 break-words mb-2 line-clamp-2 cursor-pointer"
      title={title}
    >
      {title}
    </h3>
  ) : (
    <h3
      className="text-sm font-semibold text-gray-800 break-words mb-2 line-clamp-2 hover:text-blue-500 cursor-pointer transition-colors"
      onMouseEnter={handleTitleEnter}
      onMouseLeave={handleTitleLeave}
      onFocus={handleTitleEnter}
      onBlur={handleTitleLeave}
    >
      {title}
    </h3>
  );

  return (
    <div className="card-truyen w-[200px] h-[340px] bg-white rounded shadow hover:shadow-lg overflow-hidden transition flex flex-col relative">
      {!useTooltipOnly && showPopup && (
        <div
          role="dialog"
          aria-hidden={!showPopup}
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
          className="fixed z-50 w-[400px] min-h-[220px] bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex flex-col gap-3"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
          }}
        >
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>

          {extraInfo.other_name && (
            <p className="italic text-sm text-gray-600">
              Tên khác: {extraInfo.other_name}
            </p>
          )}

          <div className="flex gap-4 text-sm text-gray-600">
            <img
              src={cover || "/placeholder-image.jpg"}
              alt={title}
              className="w-[120px] h-[160px] object-cover rounded"
            />
            <div className="space-y-1">
              {extraInfo.genres && extraInfo.genres.length > 0 && (
                <p>
                  <span className="font-semibold">Thể loại:</span>{" "}
                  {extraInfo.genres.join(", ")}
                </p>
              )}
              {extraInfo.status && (
                <p>
                  <span className="font-semibold">Tình trạng:</span>{" "}
                  {extraInfo.status}
                </p>
              )}
              <p>
                <span className="font-semibold">Lượt xem:</span>{" "}
                {Number(totalViews || 0).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Theo dõi:</span>{" "}
                {Number(likes || 0).toLocaleString()}
              </p>
              {updatedAtDisplay && (
                <p>
                  <span className="font-semibold">Cập nhật:</span>{" "}
                  {updatedAtDisplay}
                </p>
              )}
            </div>
          </div>

          {extraInfo.description && (
            <p className="text-sm text-gray-700 line-clamp-5">
              {extraInfo.description}
            </p>
          )}
        </div>
      )}

      <div className="relative w-full h-52">
        <Link to={`/truyen-tranh/${slug}`}>
          <img
            src={cover || "/placeholder-image.jpg"}
            alt={title}
            title={title}
            loading="lazy"
            className="cursor-pointer w-full h-full object-cover rounded"
          />
        </Link>

        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[11px] px-2 py-1 flex justify-between">
          <div className="flex items-center gap-1 cursor-default">
            <Eye className="w-3 h-3" />
            <span>
              {totalViews >= 1000
                ? `${Math.floor(totalViews / 1000)}K`
                : Number(totalViews || 0)}
            </span>
          </div>
          <div className="flex items-center gap-1 cursor-default">
            <Heart className="w-3 h-3" />
            <span>{Number(likes || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <Link to={`/truyen-tranh/${slug}`}>{titleElement}</Link>

        <ul className="text-xs text-gray-700 space-y-1 mt-auto">
          {chapters.length > 0 &&
            chapters.slice(0, 3).map((chap, idx) => {
              const match = chap.title.match(/[\d.]+/);
              const chapNum = match ? match[0] : "1";
              return (
                <li
                  key={idx}
                  title={chap.title}
                  className="flex justify-between items-center gap-1"
                >
                  <Link
                    to={`/truyen-tranh/${slug}/chuong-${chapNum}`}
                    className="text-black hover:text-blue-500 cursor-pointer transition-colors truncate max-w-[70%] font-normal text-[12px]"
                    aria-label={`Đọc ${chap.title}`}
                  >
                    {chap.title.length > 30
                      ? chap.title.slice(0, 30) + "..."
                      : chap.title}
                  </Link>
                  {chap.time && (
                    <span className="text-gray-400 text-[12px] italic whitespace-nowrap ml-1">
                      {chap.time}
                    </span>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
};
