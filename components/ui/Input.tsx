import styles from './Input.module.css'

interface InputProps {
  label: string
  name: string
  type?: string
  required?: boolean
  as?: 'input' | 'textarea'
  placeholder?: string
  defaultValue?: string
}

export function Input({
  label,
  name,
  type = 'text',
  required,
  as = 'input',
  placeholder,
  defaultValue,
}: InputProps) {
  const id = `field-${name}`
  const fieldClass = `${styles.field} ${as === 'textarea' ? styles.textarea : ''}`

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={fieldClass}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={fieldClass}
        />
      )}
    </div>
  )
}
