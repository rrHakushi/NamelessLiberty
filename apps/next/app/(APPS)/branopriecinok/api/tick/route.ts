import { NextRequest, NextResponse } from "next/server"
import { POST as handleMarketPost } from "../market/route"

export async function POST(request: NextRequest) {
  return handleMarketPost(request)
}
