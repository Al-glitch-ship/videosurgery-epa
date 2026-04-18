import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Video,
  Bell,
  Check,
  FolderOpen,
  UserPlus,
  Film,
  Clock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getInitials, formatDate } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";

  // Fetch notifications
  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30000, // poll every 30s
  });

  const utils = trpc.useUtils();

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Close notification panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notifOpen]);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invites", label: "Convites", icon: Mail },
    { href: "/stats", label: "Estatísticas", icon: BarChart3 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  function getNotifIcon(type: string) {
    switch (type) {
      case "invite_received":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "invite_accepted":
        return <Check className="h-4 w-4 text-emerald-500" />;
      case "video_uploaded":
        return <Film className="h-4 w-4 text-purple-500" />;
      case "evaluation_received":
        return <BarChart3 className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  }

  function handleNotifClick(notif: any) {
    if (!notif.isRead) {
      markAsRead.mutate({ id: notif.id });
    }
    setNotifOpen(false);
    // Navigate based on notification type
    if (notif.link) {
      window.location.href = notif.link;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a]">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="hidden font-serif text-xl font-semibold sm:inline">
              VideoSurgery <span className="text-[#d4af37]">EPA</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side: Notifications + User Menu */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border bg-background shadow-lg z-50">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-sm">Notificações</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => markAllAsRead.mutate()}
                      >
                        Marcar todas como lidas
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma notificação
                        </p>
                      </div>
                    ) : (
                      <div>
                        {notifications.map((notif: any) => (
                          <button
                            key={notif.id}
                            className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-3 border-b last:border-b-0 ${
                              !notif.isRead ? "bg-primary/5" : ""
                            }`}
                            onClick={() => handleNotifClick(notif)}
                          >
                            <div className="mt-0.5 shrink-0">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notif.isRead ? "font-medium" : ""}`}>
                                {notif.title}
                              </p>
                              {notif.message && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(notif.createdAt)}
                                </span>
                              </div>
                            </div>
                            {!notif.isRead && (
                              <div className="mt-1.5 shrink-0">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a] text-white text-sm">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#2d5a4a] text-white text-xs">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>
    </div>
  );
}
