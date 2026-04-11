import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const handler = auth.handler

export { handler as GET, handler as POST }
