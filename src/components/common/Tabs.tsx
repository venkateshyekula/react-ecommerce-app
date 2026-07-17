import type { ReactNode } from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: string;
  badge?: ReactNode;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
}

const Tabs = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = ""
}: TabsProps<T>) => {
  return (
    <div className={`app-tabs ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`app-tab ${isActive ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon ? <i className={`${tab.icon} me-2`} /> : null}

            <span>{tab.label}</span>

            {tab.badge ? <span className="app-tab-badge">{tab.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;