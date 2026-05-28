import styles from './Button.module.css'

type Variant = 'primary' | 'outline' | 'ghost'

interface ButtonProps {
  variant?: Variant
  href?: string
  download?: boolean | string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  href,
  download,
  onClick,
  type = 'button',
  disabled,
  children,
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]}`

  if (href) {
    return (
      <a href={href} download={download} className={className}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}
