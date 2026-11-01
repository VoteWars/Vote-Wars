'use client'
import Link from 'next/link';import {usePathname} from 'next/navigation';import {House,Plus,Flame,UserRound} from 'lucide-react'
const tabs=[['/', 'Home',House],['/create','Create',Plus],['/brands','Brands',Flame],['/profile','Profile',UserRound]] as const
export default function BottomNav(){const path=usePathname();return <nav className="bottom-nav">{tabs.map(([href,label,Icon])=><Link key={href} href={href} className={path===href?'active':''}><Icon size={19}/><span>{label}</span></Link>)}</nav>}
