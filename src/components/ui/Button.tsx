import React from "react";
import clsx from "clsx";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  style,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded px-4 py-2 font-medium transition duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "hover:opacity-90 active:scale-[0.98]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={style}
    >
      {children}
    </button>
  );
};
