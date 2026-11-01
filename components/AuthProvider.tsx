'use client'
import { createContext,useContext,useEffect,useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
const C=createContext<{session:Session|null;ready:boolean}>({session:null,ready:false})
export function AuthProvider({children}:{children:React.ReactNode}) { const [session,setSession]=useState<Session|null>(null);const [ready,setReady]=useState(false);useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);return <C.Provider value={{session,ready}}>{children}</C.Provider> }
export const useAuth=()=>useContext(C)
