import type { Config } from 'tailwindcss'
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { bg: 'var(--color-bg)', surface: 'var(--color-surface)', border: 'var(--color-border)', yellow: 'var(--color-yellow)', blue: 'var(--color-blue)', red: 'var(--color-red)', text: 'var(--color-text)', muted: 'var(--color-muted)', green: 'var(--color-green)' }, borderRadius: { card: '16px' }, fontFamily: { sans: ['Satoshi','sans-serif'] } } }, plugins: [] }
export default config
