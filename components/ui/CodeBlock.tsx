import styles from './CodeBlock.module.css'

interface CodeBlockProps {
  children: string
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <div className={styles.block}>
      <code className={styles.code}>{children}</code>
    </div>
  )
}
