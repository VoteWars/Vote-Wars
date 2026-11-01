import {NextResponse} from 'next/server';import {requireViewer} from '@/lib/server'
export async function GET(req:Request){const user=await requireViewer(req);return NextResponse.json({admin:!!user&&!!process.env.ADMIN_EMAIL&&user.email?.toLowerCase()===process.env.ADMIN_EMAIL.toLowerCase()})}
