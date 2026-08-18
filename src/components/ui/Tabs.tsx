import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 p-1 bg-[#E7D5BE]/40 dark:bg-stone-900/60 rounded-2xl border border-[#E7D5BE] dark:border-stone-800 overflow-x-auto scrollbar-none font-brand-sans ${className}`} role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              isActive
                ? 'bg-[#B85C38] text-white shadow-xs'
                : 'text-[#8A5A44] dark:text-[#E7D5BE] hover:bg-[#FAF6EF]/60 dark:hover:bg-stone-800 hover:text-[#292724] dark:hover:text-white'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-[#9E4A2A] text-white' : 'bg-[#D4BEA2] text-[#292724]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
