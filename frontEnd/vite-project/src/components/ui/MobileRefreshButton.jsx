import { RefreshCw } from "lucide-react";
import Button from "./Button";

export default function MobileRefreshButton({
  onClick,
  onRefresh,
  loading = false,
  className = "",
}) {
  const handler = onRefresh ?? onClick;
  return (
    <div className={`md:hidden ${className}`.trim()}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handler}
        loading={loading}
        loadingText="Refreshing"
        className="w-auto shrink-0"
        leftIcon={loading ? undefined : RefreshCw}
      >
        {loading ? "Refreshing" : "Refresh"}
      </Button>
    </div>
  );
}
