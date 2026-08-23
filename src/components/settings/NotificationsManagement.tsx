"use client";

import React, { useState, useTransition, useMemo } from "react";
import { NotificationService } from "@/services";
import type { Notification, NotificationType } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface NotificationsManagementProps {
  initialNotifications: Notification[];
}

type NotificationFormData = {
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
};

const emptyForm: NotificationFormData = {
  type: "info",
  title: "",
  message: "",
  isRead: false,
};

const NOTIFICATION_TYPES: NotificationType[] = ["info", "success", "warning", "error"];

export default function NotificationsManagement({ initialNotifications }: NotificationsManagementProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !notification.title.toLowerCase().includes(q) &&
          !notification.message.toLowerCase().includes(q) &&
          !notification.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filterRead === "read" && !notification.isRead) return false;
      if (filterRead === "unread" && notification.isRead) return false;
      return true;
    });
  }, [notifications, searchQuery, filterRead]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const created = await NotificationService.createNotification({
          type: formData.type,
          title: formData.title,
          message: formData.message,
          isRead: formData.isRead,
        });
        setNotifications((prev) => [created, ...prev]);
        addToast("Notification created successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to create notification. Please check the form.", "error");
      }
    });
  };

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      try {
        await NotificationService.markAsRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        addToast("Notification marked as read", "success");
      } catch {
        addToast("Failed to mark notification as read", "error");
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        await NotificationService.markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        addToast("All notifications marked as read", "success");
      } catch {
        addToast("Failed to mark all notifications as read", "error");
      }
    });
  };

  const getTypeBadgeColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "info";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isPending || unreadCount === 0}>
            Mark All Read
          </Button>
          <Button onClick={() => { setFormData(emptyForm); setIsModalOpen(true); }}>New Notification</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No notifications found.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id} className={!notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {!notification.isRead ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                      ) : (
                        <span className="inline-flex h-2 w-2 rounded-full bg-gray-300"></span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getTypeBadgeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{notification.title}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{notification.message}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(notification.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {!notification.isRead && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          Mark Read
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Notification</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Order Completed"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="Notification message"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRead"
                name="isRead"
                checked={formData.isRead}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isRead" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Read</label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create Notification"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
