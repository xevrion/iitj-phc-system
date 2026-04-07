import React from "react";
import { cn } from "../../../utils/cn";

const OverviewCard = ({ title, value, subtext, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 leading-none">
            {value}
          </h3>
          {subtext && (
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", colorClass)}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
