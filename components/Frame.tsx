'use client'
import Backdrop from './Backdrop';import SiteHeader from './SiteHeader';import BottomNav from './BottomNav'
export default function Frame({children}:{children:React.ReactNode}){return <><Backdrop/><SiteHeader/><main className="page-wrap">{children}</main><BottomNav/></>}
