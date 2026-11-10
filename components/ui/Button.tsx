import NextLink from 'next/link'
import styles from './Button.module.css'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps {
  variant?: Variant
  size?: Size
  href?: string
  download?: boolean | string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'sm',
  href,
  download,
  onClick,
  type = 'button',
  disabled,
  children,
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]}${size === 'md' ? ` ${styles.md}` : ''}`

  if (href) {
    if (href.startsWith('/')) {
      return (
        <NextLink href={href} download={download} className={className}>
          {children}
        </NextLink>
      )
    }

    return (
      <a href={href} download={download} className={className}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}
