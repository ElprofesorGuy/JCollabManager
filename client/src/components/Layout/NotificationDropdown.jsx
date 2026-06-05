import React, { useRef, useEffect } from 'react';
import useNotificationStore from '../../store/useNotificationStore';
import { Bell, Check, Trash2, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconForType = (type) => {
    switch (type) {
      case 'NOUVELLE_TACHE':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'COMMENTAIRE_AJOUTE':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'RAPPEL_ECHEANCE':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    }
    onClose();
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="font-semibold text-gray-700">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Vous n'avez aucune notification.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <li 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 ${!notif.read ? 'bg-primary-50/30' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIconForType(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-800 ${!notif.read ? 'font-semibold' : ''}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
