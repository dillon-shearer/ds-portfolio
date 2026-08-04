import type { Metadata } from 'next'
import { Rule, Button, Card } from '@/components/ui'
import { HERO, CAPABILITIES } from '@/content/home'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Data With Dillon',
  description:
    'Data engineer and analyst working in healthcare and life science data.',
}

export default function HomePage() {
  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.roleLabel}>{HERO.roleLabel}</p>
        <h1 className={styles.name}>{HERO.name}</h1>
        <p className={styles.valueProp}>{HERO.statement}</p>
        <div className={styles.ctas}>
          <Button href={HERO.ctas.primary.href} variant="primary">{HERO.ctas.primary.label}</Button>
          <Button href={HERO.ctas.secondary.href} variant="outline">{HERO.ctas.secondary.label}</Button>
        </div>
      </section>

      {/* What I Do */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The work</h2>
        <div className={styles.cards}>
          {CAPABILITIES.map((cap) => (
            <Card
              key={cap.title}
              eyebrow={cap.eyebrow}
              title={cap.title}
              description={cap.description}
              badges={cap.tags}
            />
          ))}
        </div>
      </section>

    </div>
  )
}
