import { Button } from "@/components/ui/button";

export function LuxePrimary(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} className={["rounded-2xl bg-[#FFD700] text-black hover:bg-[#e6c400]", props.className].join(" ")} />;
}
export function LuxeOutline(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} variant="outline" className={["rounded-2xl border-[#FFD700] text-white bg-black hover:bg-[#121212]", props.className].join(" ")} />;
}