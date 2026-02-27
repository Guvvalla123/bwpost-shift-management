import React from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

const ShiftRow = ({ shift, onEdit, onDelete }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {shift.shiftTitle}
      </TableCell>

      <TableCell>
        {new Date(shift.shiftStartTime).toLocaleString("en-GB")}
      </TableCell>

      <TableCell>
        {new Date(shift.shiftEndTime).toLocaleString("en-GB")}
      </TableCell>

      <TableCell>
        {shift.slotsAvailable}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex justify-end gap-2 bg-white-50 p-2 rounded-lg">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onEdit(shift)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onDelete(shift._id)}
          >
            Delete
          </Button>
        </div>
      </TableCell>

    </TableRow>
  );
};

export default ShiftRow;
