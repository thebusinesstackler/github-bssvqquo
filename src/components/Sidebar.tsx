import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  Settings,
  ClipboardList,
  Building2,
  FileText,
  HelpCircle,
  Megaphone,
  Bell,
  DollarSign,
  Calendar,
  BarChart4,
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
  role?: 'admin' | 'partner' | 'sponsor';
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, impersonatedUser } = useAuthStore();
  const effectiveUser = impersonatedUser || user;

  const sidebarItems: SidebarItem[] = [
    // Admin Items
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', role: 'admin' },
    { icon: Building2, label: 'Partners', path: '/admin/partners', role: 'admin' },
    { icon: Users, label: 'Users', path: '/admin/users', role: 'admin' },
    { icon: ClipboardList, label: 'Leads', path: '/admin/leads', role: 'admin' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions', role: 'admin' },
    { icon: FileText, label: 'Forms', path: '/admin/forms', role: 'admin' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications', role: 'admin' },
    { icon: Settings, label: 'Settings', path: '/settings', role: 'admin' },
    
    // Partner Items
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', role: 'partner' },
    { icon: ClipboardList, label: 'My Leads', path: '/leads', role: 'partner' },
    { icon: FileText, label: 'Messages', path: '/messages', role: 'partner' },
    { icon: Megaphone, label: 'Promote Study', path: '/customers', role: 'partner' },
    { icon: HelpCircle, label: 'Support', path: '/support', role: 'partner' },
    { icon: Settings, label: 'Settings', path: '/settings', role: 'partner' },
    
    // Sponsor Items
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', role: 'sponsor' },
    { icon: ClipboardList, label: 'Studies', path: '/leads', role: 'sponsor' },
    { icon: FileText, label: 'Messages', path: '/messages', role: 'sponsor' },
    { icon: HelpCircle, label: 'Support', path: '/support', role: 'sponsor' },
    { icon: Settings, label: 'Settings', path: '/settings', role: 'sponsor' }
  ];

  const filteredItems = sidebarItems.filter(item => 
    !item.role || item.role === effectiveUser?.role
  );

  return (
    <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {filteredItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              } group`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${
                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? 'text-blue-600'
                  : 'text-gray-400 group-hover:text-blue-600'
              }`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}