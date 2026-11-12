export function isAllowedOrigin(origin: string | null) {
  if (!origin) return false
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://datawithdillon.com',
    'https://www.datawithdillon.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[]
  return allowed.some((base) => origin.startsWith(base))
}
