import NextLink from 'next/link'
import styles from './Link.module.css'

interface InlineLinkProps {
  href: string
  children: React.ReactNode
  external?: boolean
}

export function InlineLink({ href, children, external }: InlineLinkProps) {
  if (external) {
    return (
      <a
        href={href}
        className={styles.inline}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }
  return (
    <NextLink href={href} className={styles.inline}>
      {children}
    </NextLink>
  )
}

interface NavLinkProps {
  href: string
  children: React.ReactNode
  currentPath?: string
}

export function NavLink({ href, children, currentPath }: NavLinkProps) {
  const isCurrent = currentPath === href
  return (
    <NextLink
      href={href}
      className={styles.nav}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {children}
    </NextLink>
  )
}
