import type { Metadata } from 'next';import './globals.css';import {AuthProvider} from '@/components/AuthProvider';import Frame from '@/components/Frame'
export const metadata:Metadata={title:'Vote wars — Pick a side.',description:'The internet decides. VoteWars is your arena.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider><Frame>{children}</Frame></AuthProvider></body></html>}
