interface RuleProps {
  weight?: 'hairline' | 'medium'
}

export function Rule({ weight = 'hairline' }: RuleProps) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `var(--rule-${weight}) solid var(--color-rule)`,
        margin: 0,
        width: '100%',
      }}
    />
  )
}
