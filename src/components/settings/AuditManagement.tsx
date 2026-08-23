"use client";

import React, { useState, useMemo } from "react";
import type { AuditLog } from "@/domain/types";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

interface AuditManagementProps {
  initialLogs: AuditLog[];
}

const ACTION_COLORS: Record<string, string> = {
  create: "success",
  update: "info",
  delete: "error",
  archive: "warning",
};

export default function AuditManagement({ initialLogs }: AuditManagementProps) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterActor, setFilterActor] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const entities = useMemo(() => {
    const set = new Set(logs.map((l) => l.entity));
    return Array.from(set).sort();
  }, [logs]);

  const actors = useMemo(() => {
    const set = new Set(logs.map((l) => l.actorName));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !log.action.toLowerCase().includes(q) &&
          !log.entity.toLowerCase().includes(q) &&
          !log.entityId.toLowerCase().includes(q) &&
          !log.actorName.toLowerCase().includes(q) &&
          !log.reason?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filterEntity !== "all" && log.entity !== filterEntity) return false;
      if (filterActor !== "all" && log.actorName !== filterActor) return false;
      return true;
    });
  }, [logs, searchQuery, filterEntity, filterActor]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (data?: Record<string, unknown>) => {
    if (!data) return "—";
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Activity and change history</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by action, entity, actor, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Entities</option>
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Actors</option>
            {actors.map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Entity ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{log.actorName}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={(ACTION_COLORS[log.action] || "light") as BadgeColor}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">{log.entity}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{log.entityId}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{log.reason || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(log.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log Details</h3>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actor</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.actorName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Action</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Entity</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedLog.entity}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Entity ID</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.entityId}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reason</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.reason || "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Before</p>
                <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {formatJson(selectedLog.before)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">After</p>
                <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {formatJson(selectedLog.after)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
