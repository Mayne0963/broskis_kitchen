import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LuxeTableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.12)]">{children}</div>;
}
export { Table as LuxeTable, TableBody as LuxeTableBody, TableCell as LuxeTableCell, TableHead as LuxeTableHead, TableHeader as LuxeTableHeader, TableRow as LuxeTableRow };