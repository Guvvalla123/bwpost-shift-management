/**
 * Shared shift status logic (upcoming / ongoing / completed).
 * Used by ManagerShifts, Dashboard, MyShifts, EmployeeShifts.
 */
const now = () => new Date();

export const getStatus = (start, end) => {
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const n = now();
  if (n < s) return "upcoming";
  if (e && n <= e) return "ongoing";
  return "completed";
};
