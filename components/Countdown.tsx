'use client'
import {useEffect,useState} from 'react'
export default function Countdown({expiresAt}:{expiresAt:string|null}){const [text,setText]=useState('—');useEffect(()=>{if(!expiresAt)return;const update=()=>{const ms=new Date(expiresAt).getTime()-Date.now();if(ms<=0){setText('Ended');return}const d=Math.floor(ms/86400000),h=Math.floor(ms%86400000/3600000),m=Math.floor(ms%3600000/60000);setText(d?`${d}d ${h}h`:`${h}h ${m}m`)};update();const i=setInterval(update,30000);return()=>clearInterval(i)},[expiresAt]);return <span className="countdown brand-yellow">{text}</span>}
