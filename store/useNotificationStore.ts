import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface StudioNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms. 0 significa que não apaga sozinho
}

interface NotificationState {
  notifications: StudioNotification[];
  
  // Actions
  addNotification: (notification: Omit<StudioNotification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notif) => {
    const id = uuidv4();
    const newNotif = { ...notif, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotif]
    }));

    const duration = notif.duration !== undefined ? notif.duration : 5000;
    
    if (duration > 0 && notif.type !== 'loading') {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
    
    return id;
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearAll: () => set({ notifications: [] })
}));
