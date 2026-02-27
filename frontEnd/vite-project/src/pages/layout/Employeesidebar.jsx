import React from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
const Employeesidebar = () => {
    const { pathname } = useLocation();
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>BW POST</SidebarGroupLabel>

                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/employee/dashboard"}>
                                <Link to="/employee/dashboard">Dashboard</Link>
                            </SidebarMenuButton>
                            <SidebarMenuButton asChild isActive={pathname === "/employee/AllShifts"}>
                                <Link to="/employee/AllShifts">All Shifts</Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default Employeesidebar
