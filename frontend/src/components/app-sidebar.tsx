"use client";

import * as React from "react";
import { Command, MessageCircle, Trash2 } from "lucide-react";

import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import ChatList from "./chat-list";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

// This is sample data
const data = {
  user: {
    name: "gargash-group",
    email: "ai@gargash-group.com",
    avatar: "/avatars/gargash.jpg",
  },
  navMain: [
    {
      title: "Chats",
      url: "/",
      icon: MessageCircle,
      isActive: true,
    },

    {
      title: "Trash",
      url: "#",
      icon: Trash2,
      isActive: false,
    },
  ],
  mails: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem] = React.useState(data.navMain[0]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      style={
        {
          "--sidebar-background": "hsl(270 60% 20%)",
          "--sidebar-foreground": "hsl(36 50% 75%)",
          "--sidebar-primary": "hsl(36 50% 65%)",
          "--sidebar-primary-foreground": "hsl(270 60% 20%)",
          "--sidebar-accent": "hsl(270 50% 30%)",
          "--sidebar-accent-foreground": "hsl(36 50% 75%)",
          "--sidebar-border": "hsl(270 50% 30%)",
        } as React.CSSProperties
      }
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r border-[#4a2a80]"
        style={{ backgroundColor: "#3a1c70" }}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="md:h-8 md:p-0 text-[#d5b26b]"
              >
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#d5b26b] text-[#3a1c70]">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Gargash</span>
                    <span className="truncate text-xs text-[#c4a05a]">
                      Enterprise
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2 text-[#c4a05a] data-[active=true]:bg-[#4a2a80] data-[active=true]:text-[#d5b26b]"
                    >
                      <item.icon
                        className={
                          activeItem?.title === item.title
                            ? "text-[#d5b26b]"
                            : "text-[#c4a05a]"
                        }
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar
        collapsible="none"
        className="hidden flex-1 md:flex"
        style={{ backgroundColor: "#4a2a80" }}
      >
        <SidebarHeader className="gap-3.5 border-b border-[#5c3a92] p-4">
          <Image src={"/logo.avif"} alt="" width={200} height={120} />
          <div className="my-2">
            <Button
              className="w-full cursor-pointer"
              variant={"secondary"}
              asChild
            >
              <Link href="/">New chat</Link>
            </Button>
          </div>
          <SidebarInput
            placeholder="Type to search..."
            className="bg-[#3a1c70] text-[#d5b26b] placeholder:text-[#a08548]/70 border-[#5c3a92] focus-visible:ring-[#d5b26b]"
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              <ChatList />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
