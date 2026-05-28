'use client'

import { useState } from 'react'
import styles from './DashboardShell.module.css'

type Tab = { label: string; key: string }

type Props = {
  tabs: Tab[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
}

export default function DashboardShell({ tabs, defaultTab, children }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? '')

  return (
    <div className={styles.shell}>
      <nav className={styles.tabBar} aria-label="Dashboard sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={[styles.tab, active === tab.key ? styles.tabActive : ''].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={styles.content}>
        {children(active)}
      </div>
    </div>
  )
}
