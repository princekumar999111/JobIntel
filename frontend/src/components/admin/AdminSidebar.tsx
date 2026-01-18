import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  BarChart3,
  Globe,
  CreditCard,
  Handshake,
  Shield,
  Zap,
  Building2,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
  { icon: Briefcase, label: 'Job Portal', path: '/job-portal' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Zap, label: 'Job Scraping', path: '/admin/job-scraping' },
  { icon: BarChart3, label: 'Job Statistics', path: '/admin/job-stats' },
  { icon: Zap, label: 'Scraper Config', path: '/admin/scraper-config' },
  { icon: Building2, label: 'Companies', path: '/admin/companies' },
  { icon: CheckCircle2, label: 'Verify Companies', path: '/admin/company-verification' },
  { icon: BarChart3, label: 'Company Analytics', path: '/admin/company-analytics' },
  { icon: BarChart3, label: 'Platform Analytics', path: '/admin/analytics/platform' },
  { icon: BarChart3, label: 'User Analytics', path: '/admin/analytics/users' },
  { icon: BarChart3, label: 'Company Performance', path: '/admin/analytics/companies' },
  { icon: BarChart3, label: 'Recommendation Analytics', path: '/admin/recommendations/insights' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: Handshake, label: 'Referrals', path: '/admin/referrals' },
  { icon: Globe, label: 'Crawlers', path: '/admin/crawlers' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: CreditCard, label: 'Revenue', path: '/admin/revenue' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
  { icon: Users, label: 'Profile Fields', path: '/admin/profile-fields' },
  { icon: Briefcase, label: 'Skills', path: '/admin/skills' },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    // hide regular sidebar on small screens; show on lg+
    <aside
      className={cn(
        'hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <span className="text-white font-bold text-sm">JI</span>
              </div>
              <span className="font-bold text-foreground">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Exit Admin</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
