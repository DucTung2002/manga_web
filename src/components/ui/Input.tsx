import React from "react";
import clsx from "clsx";

type InputProps = {
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  autoComplete?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({
  value,
  onChange,
  placeholder = "",
  type = "text",
  name,
  disabled = false,
  className = "",
  style,
  title,
  autoComplete,
  ...rest
}: InputProps) => {
  return (
    <input
      type={type}
      name={name}
      value={type !== "file" ? value : undefined}
      disabled={disabled}
      placeholder={placeholder}
      onChange={onChange}
      className={clsx(
        "w-full rounded border border-gray-300 focus:outline-none focus:ring-0 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={style}
      title={title}
      autoComplete={autoComplete}
      {...rest}
    />
  );
};
