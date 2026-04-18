import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(
  (
    {
      className,
      type,
      label,
      error,
      leftAdornment,
      rightAdornment,
      inputClassName,
      ...props
    },
    ref
  ) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className={cn("relative", className)}>
        {leftAdornment ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftAdornment}
          </div>
        ) : null}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            leftAdornment && "pl-10",
            rightAdornment && "pr-11",
            error && "border-red-500 focus-visible:ring-red-500",
            inputClassName
          )}
          ref={ref}
          {...props}
        />
        {rightAdornment ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightAdornment}
          </div>
        ) : null}
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
  }
);

Input.displayName = "Input";

export default Input;
