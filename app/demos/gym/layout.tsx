import { JsonLd } from '@/components/JsonLd'
import { GYM_DASHBOARD_PAGE } from '@/content/dashboards'
import { breadcrumbJsonLd } from '@/lib/json-ld'

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd data={breadcrumbJsonLd(GYM_DASHBOARD_PAGE.breadcrumbs)} />
    </>
  )
}
