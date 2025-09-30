export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function AdminHealth() {
  return <div style={{padding:20, fontFamily:"system-ui"}}>Admin route alive</div>;
}