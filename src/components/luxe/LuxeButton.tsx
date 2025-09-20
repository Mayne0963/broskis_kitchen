import { Button } from "@/components/ui/button";

export function LuxePrimary(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={[
        "rounded-2xl",
        "bg-[#FFD700] text-black hover:bg-[#e6c400]",
        "shadow-[0_2px_12px_rgba(255,215,0,0.3)]",
        props.className || "",
      ].join(" ")}
    />
  );
}

export function LuxeOutline(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      variant="outline"
      className={[
        "rounded-2xl",
        "border-2 border-[#FFD700] text-white",
        "bg-black hover:bg-[#0b0b0b]",
        "shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
        props.className || "",
      ].join(" ")}
    />
  );
}