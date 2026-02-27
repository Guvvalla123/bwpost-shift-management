import { Pencil, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ShiftTable = ({ shifts, onEdit, onDelete }) => {
  const now = new Date();

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-muted-foreground">
            <th className="px-6 py-3 text-left font-medium">
              Shift
            </th>
            <th className="px-6 py-3 text-left font-medium">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left font-medium">
              Slots
            </th>
            <th className="px-6 py-3 text-left font-medium">
              Status
            </th>
            <th className="px-6 py-3 text-right font-medium">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {shifts.map((shift) => {
            const isUpcoming =
              new Date(shift.shiftStartTime) > now;

            return (
              <tr
                key={shift._id}
                className="group hover:bg-muted/40 transition"
              >
                {/* TITLE */}
                <td className="px-6 py-4 font-medium">
                  {shift.shiftTitle}
                </td>

                {/* TIME */}
                <td className="px-6 py-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(
                      shift.shiftStartTime
                    ).toLocaleString()}
                  </div>
                </td>

                {/* SLOTS */}
                <td className="px-6 py-4">
                  {shift.slotsAvailable}
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  {isUpcoming ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Upcoming
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Completed
                    </Badge>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(shift)}
                    >
                      <Pencil
                        size={16}
                        className="text-muted-foreground hover:text-indigo-600"
                      />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(shift._id)}
                    >
                      <Trash2
                        size={16}
                        className="text-muted-foreground hover:text-rose-600"
                      />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShiftTable;
