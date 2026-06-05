import { create } from 'zustand';
import api from '../api/axiosConfig';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  stompClient: null,
  isConnected: false,

  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      const data = response.data || [];
      const unreadCount = data.filter(n => !n.read).length;
      set({ notifications: data, unreadCount });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => {
        const newNotifications = state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter(n => !n.read).length
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  },

  addNotification: (notification) => {
    set((state) => {
      // Check if we already have this notification to prevent duplicates
      if (state.notifications.some(n => n.id === notification.id)) return state;
      
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length
      };
    });
    
    // Optional: show a toast notification for new messages
    toast('Nouvelle notification : ' + notification.message, {
      icon: '🔔',
    });
  },

  connectWebSocket: () => {
    const state = get();
    if (state.isConnected) return; // Prevent multiple connections

    // Obtenir le token (si vous l'utilisez pour l'authentification dans l'en-tête ou cookie)
    // Ici on suppose que le token est envoyé via cookie HTTPOnly ou que SockJS s'appuie sur la session
    const socket = new SockJS('http://localhost:9000/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str); // Uncomment for debugging STOMP
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      set({ isConnected: true, stompClient: client });
      // S'abonner au canal privé
      client.subscribe('/user/queue/notifications', (message) => {
        if (message.body) {
          const notification = JSON.parse(message.body);
          get().addNotification(notification);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();
  },

  disconnectWebSocket: () => {
    const { stompClient } = get();
    if (stompClient && stompClient.active) {
      stompClient.deactivate();
      set({ isConnected: false, stompClient: null });
    }
  }
}));

export default useNotificationStore;
