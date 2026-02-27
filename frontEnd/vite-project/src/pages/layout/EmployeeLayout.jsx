import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Employeesidebar from "./Employeesidebar";
import { Outlet } from "react-router-dom";

const EmployeeLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Employeesidebar />

        <main className="flex-1 p-6">
          <SidebarTrigger className="mb-4 md:hidden" />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeLayout;
