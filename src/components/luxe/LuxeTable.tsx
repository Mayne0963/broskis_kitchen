import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LuxeTableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-[#FFD700]/60 bg-[#0b0b0b]">
      {children}
    </div>
  );
}
export { Table as LuxeTable, TableBody as LuxeTableBody, TableCell as LuxeTableCell, TableHead as LuxeTableHead, TableHeader as LuxeTableHeader, TableRow as LuxeTableRow };