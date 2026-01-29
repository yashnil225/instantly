"use client";

import React from "react";

const ButtonGradient = ({
  title = "Gradient Button",
  onClick = () => { },
}: {
  title?: string;
  onClick?: () => void;
}) => {
  return (
    <button className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4 cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md animate-shimmer" onClick={onClick}>
      {title}
    </button>
  );
};

export default ButtonGradient;
