import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LuxeCard(props: React.ComponentProps<typeof Card>) {
  return (
    <Card
      {...props}
      className={[
        "rounded-2xl",
        "bg-[#121212]", // darker than before for separation
        "text-white",
        "border border-[#FFD700]/80", // brighter gold border
        "shadow-[0_4px_20px_rgba(0,0,0,0.45)]",
        props.className || "",
      ].join(" ")}
    />
  );
}
export { CardContent as LuxeCardContent, CardHeader as LuxeCardHeader, CardTitle as LuxeCardTitle };