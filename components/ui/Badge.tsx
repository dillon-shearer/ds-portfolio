interface BadgeProps {
  children: React.ReactNode
}

export function Badge({ children }: BadgeProps) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide)',
        lineHeight: 'var(--leading-snug)',
        border: 'var(--rule-hairline) solid var(--color-rule)',
        padding: '2px var(--space-2)',
        display: 'inline-block',
        color: 'var(--color-ink-2)',
      }}
    >
      {children}
    </span>
  )
}
