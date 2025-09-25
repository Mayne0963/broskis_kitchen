import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userid: string }> }
) {
  const { userid } = await params;
  // TODO: fetch & return summary for userid
  return NextResponse.json({ success: true, userid, summary: {} });
}