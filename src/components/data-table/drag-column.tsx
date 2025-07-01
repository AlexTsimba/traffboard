import { useSortable } from "@dnd-kit/sortable";
import { type ColumnDef } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";

function DragHandle({ id }: { readonly id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      className="text-muted-foreground size-7 hover:bg-transparent"
      size="icon"
      variant="ghost"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

export const dragColumn: ColumnDef<{ id: number }> = {
  id: "drag",
  header: () => null,
  cell: ({ row }) => <DragHandle id={row.original.id} />,
  enableSorting: false,
  enableHiding: false,
};
