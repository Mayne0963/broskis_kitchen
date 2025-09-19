import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LuxeCard(props: React.ComponentProps<typeof Card>) {
  return <Card {...props} className={["rounded-2xl border-[#FFD700] bg-[#0b0b0b] text-white", props.className].join(" ")} />;
}
export { CardContent as LuxeCardContent, CardHeader as LuxeCardHeader, CardTitle as LuxeCardTitle };