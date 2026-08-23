"use client";

import React, { useState, useTransition, useMemo } from "react";
import { ShiftService } from "@/services";
import type { Shift } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useAuthStore } from "@/stores/auth";

interface ShiftsManagementProps {
  initialShifts: Shift[];
}

type OpenShiftFormData = {
  branchId: string;
  userId: string;
  openingCash: string;
};

type CloseShiftFormData = {
  closingCash: string;
  note: string;
};

const emptyOpenForm: OpenShiftFormData = {
  branchId: "",
  userId: "",
  openingCash: "",
};

const emptyCloseForm: CloseShiftFormData = {
  closingCash: "",
  note: "",
};

const SHIFT_STATUSES: Shift["status"][] = ["open", "closed"];

export default function ShiftsManagement({ initialShifts }: ShiftsManagementProps) {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [openFormData, setOpenFormData] = useState<OpenShiftFormData>(emptyOpenForm);
  const [closeFormData, setCloseFormData] = useState<CloseShiftFormData>(emptyCloseForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const { user } = useAuthStore();

  const branches = [
    { id: "br-1", name: "Main Branch" },
    { id: "br-2", name: "Gulshan Branch" },
  ];

  const users = [
    { id: "usr-1", name: "System Owner" },
    { id: "usr-2", name: "Alice Manager" },
    { id: "usr-3", name: "Bob Manager" },
    { id: "usr-4", name: "Charlie Cashier" },
    { id: "usr-5", name: "Diana Inventory" },
    { id: "usr-6", name: "Evan Accountant" },
  ];

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!shift.id.toLowerCase().includes(q) && !shift.userId.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== "all" && shift.status !== filterStatus) {
        return false;
      }
      if (filterBranch !== "all" && shift.branchId !== filterBranch) {
        return false;
      }
      return true;
    });
  }, [shifts, searchQuery, filterStatus, filterBranch]);

  const openCreate = () => {
    setOpenFormData({
      branchId: user?.branchId || "",
      userId: user?.id || "",
      openingCash: "",
    });
    setIsOpenModalOpen(true);
  };

  const openClose = (shift: Shift) => {
    setSelectedShift(shift);
    setCloseFormData(emptyCloseForm);
    setIsCloseModalOpen(true);
  };

  const handleOpenChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOpenFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCloseFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const openingCash = parseFloat(openFormData.openingCash);
        if (isNaN(openingCash) || openingCash < 0) {
          addToast("Please enter a valid opening cash amount.", "error");
          return;
        }
        const created = await ShiftService.openShift(openFormData.branchId, openFormData.userId, openingCash);
        setShifts((prev) => [created, ...prev]);
        addToast("Shift opened successfully", "success");
        setIsOpenModalOpen(false);
        setOpenFormData(emptyOpenForm);
      } catch {
        addToast("Failed to open shift. You may already have an open shift.", "error");
      }
    });
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    startTransition(async () => {
      try {
        const closingCash = parseFloat(closeFormData.closingCash);
        if (isNaN(closingCash) || closingCash < 0) {
          addToast("Please enter a valid closing cash amount.", "error");
          return;
        }
        const updated = await ShiftService.closeShift(selectedShift.id, closingCash, closeFormData.note || undefined);
        if (updated) {
          setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          addToast("Shift closed successfully", "success");
        } else {
          addToast("Failed to close shift.", "error");
        }
        setIsCloseModalOpen(false);
        setSelectedShift(null);
        setCloseFormData(emptyCloseForm);
      } catch {
        addToast("Failed to close shift.", "error");
      }
    });
  };

  const getStatusBadgeColor = (status: Shift["status"]) => {
    switch (status) {
      case "open":
        return "success";
      case "closed":
        return "light";
      default:
        return "primary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || userId;
  };

  const getBranchName = (branchId: string) => {
    return branches.find((b) => b.id === branchId)?.name || branchId;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Register & Shifts</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage cash register sessions and shift operations</p>
        </div>
        <Button onClick={openCreate}>Open New Shift</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by shift ID or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            {SHIFT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Shift ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Opened At</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Opening Cash</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Closing Cash</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No shifts found. Open a new shift to get started.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {shift.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {getBranchName(shift.branchId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {getUserName(shift.userId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(shift.openedAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(shift.openingCash)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(shift.totalSales)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {shift.closingCash !== undefined ? formatCurrency(shift.closingCash) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getStatusBadgeColor(shift.status)}>
                        {shift.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {shift.status === "open" && (
                        <Button variant="outline" size="sm" onClick={() => openClose(shift)}>
                          Close Shift
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

      <Modal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Open New Shift</h3>
          <form onSubmit={handleOpenSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="branchId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                <select
                  id="branchId"
                  name="branchId"
                  value={openFormData.branchId}
                  onChange={handleOpenChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="userId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                <select
                  id="userId"
                  name="userId"
                  value={openFormData.userId}
                  onChange={handleOpenChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="openingCash" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Cash</label>
                <Input
                  type="number"
                  id="openingCash"
                  name="openingCash"
                  value={openFormData.openingCash}
                  onChange={handleOpenChange}
                  min="0"
                  step={0.01}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsOpenModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Opening..." : "Open Shift"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Close Shift</h3>
          {selectedShift && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Shift ID:</span>
                  <span className="ml-2 font-medium">{selectedShift.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Branch:</span>
                  <span className="ml-2 font-medium">{getBranchName(selectedShift.branchId)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Opening Cash:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedShift.openingCash)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Sales:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedShift.totalSales)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expected Cash:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedShift.openingCash + selectedShift.cashSales - selectedShift.totalCashOut)}</span>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleCloseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="closingCash" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Closing Cash</label>
                <Input
                  type="number"
                  id="closingCash"
                  name="closingCash"
                  value={closeFormData.closingCash}
                  onChange={handleCloseChange}
                  min="0"
                  step={0.01}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                <Input
                  type="text"
                  id="note"
                  name="note"
                  value={closeFormData.note}
                  onChange={handleCloseChange}
                  placeholder="Optional closing note"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsCloseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Closing..." : "Close Shift"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
