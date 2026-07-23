import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Hospital, TestTube, Map, TrendingUp, Bell, Settings, X, LogOut, Pill, Network, AlertTriangle } from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const location = useLocation();

  let userRole = 'administration';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userRole = user.role;
    }
  } catch (e) {
    console.error('Failed to parse user role for sidebar');
  }

  const allNavItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', allowed: ['administration'] },
    { name: 'GIS Mapping', icon: <Map size={20} />, path: '/dashboard/gis', allowed: ['administration', 'researcher'] },
    { name: 'Hospitals', icon: <Hospital size={20} />, path: '/dashboard/hospitals', allowed: ['administration', 'hospital'] },
    { name: 'Laboratories', icon: <TestTube size={20} />, path: '/dashboard/labs', allowed: ['administration', 'laboratory'] },
    { name: 'Pharmacies', icon: <Pill size={20} />, path: '/dashboard/pharmacies', allowed: ['administration', 'pharmacy'] },
    { name: 'Predictions', icon: <TrendingUp size={20} />, path: '/dashboard/predictions', allowed: ['administration', 'researcher'] },
    { name: 'Alerts', icon: <AlertTriangle size={20} />, path: '/dashboard/alerts', allowed: ['administration'] },
    { name: 'FL Network', icon: <Network size={20} />, path: '/dashboard/network', allowed: ['administration'] },
  ];

  const navItems = allNavItems.filter(item => item.allowed.includes(userRole));

  return (
    <div className="h-full bg-white border-r border-slate-200 shadow-sm flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-slate-200/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">FL</span>
          </div>
          <span className="font-bold text-slate-800 text-lg">Surveillance</span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-800">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary-50 text-primary-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-200/50 space-y-1">
        <Link
          to="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Settings size={20} className="text-slate-400" />
          Settings
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-medium"
        >
          <LogOut size={20} className="text-rose-500" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
