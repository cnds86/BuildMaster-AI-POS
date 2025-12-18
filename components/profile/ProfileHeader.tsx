
import React, { useRef } from 'react';
import { User } from '../../types';
import { Camera, MapPin, UserCircle } from 'lucide-react';

interface ProfileHeaderProps {
  user: User;
  branchName: string;
  stats: {
    shifts: number;
    orders: number;
    revenue: string;
  };
  onUpdateAvatar: (file: File) => void;
  onUpdateCover: (file: File) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, branchName, stats, onUpdateAvatar, onUpdateCover 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Manager': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Staff': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (file: File) => void) => {
    const file = e.target.files?.[0];
    if (file) callback(file);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200 group">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-slate-800 to-slate-900 relative">
         {user.coverUrl ? (
            <img src={user.coverUrl} alt="Cover" className="w-full h-full object-cover" />
         ) : (
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
         
         <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 flex items-center text-sm font-medium"
         >
            <Camera className="w-4 h-4 mr-2" /> Change Cover
         </button>
         <input 
            type="file" 
            ref={coverInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleFileChange(e, onUpdateCover)} 
         />
      </div>

      {/* Profile Stats Bar */}
      <div className="h-20 md:h-24 bg-white flex justify-end items-center px-8">
         <div className="flex space-x-8 text-center hidden md:flex">
            <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Shifts</p>
               <p className="text-xl font-bold text-slate-800">{stats.shifts}</p>
            </div>
            <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Orders</p>
               <p className="text-xl font-bold text-slate-800">{stats.orders}</p>
            </div>
            <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Revenue</p>
               <p className="text-xl font-bold text-green-600">{stats.revenue}</p>
            </div>
         </div>
      </div>

      {/* Floating Avatar & Info */}
      <div className="absolute top-32 md:top-40 left-6 md:left-10 flex items-end">
         <div className="relative group/avatar">
            <div 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden flex items-center justify-center cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
               {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                  <UserCircle className="w-20 h-20 text-slate-300" />
               )}
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
               </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, onUpdateAvatar)} 
            />
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Active"></div>
         </div>
         
         <div className="mb-4 ml-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{user.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
               <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide backdrop-blur-md shadow-sm ${getRoleBadgeColor(user.role)} bg-opacity-90`}>
                  {user.role}
               </span>
               <span className="text-slate-200 text-sm font-medium flex items-center drop-shadow-sm">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {branchName}
               </span>
            </div>
         </div>
      </div>
    </div>
  );
};
