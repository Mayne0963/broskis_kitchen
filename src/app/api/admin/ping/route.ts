export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  return new Response("ok", { 
    status: 204, 
    headers: { 
      "cache-control": "no-store" 
    } 
  });
}