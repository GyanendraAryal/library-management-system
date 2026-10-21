import api from "./api";
import type {
  ApprovePayload,
  BorrowRequest,
  BorrowRequestPayload,
  PaginatedResponse,
} from "../types";

export interface AdminBorrowFilters {
  status?: string;
  book?: number;
  user__username?: string;
  approved_by?: number;
  limit?: number;
  offset?: number;
}

export const borrowingService = {
  async adminListAll(params?: AdminBorrowFilters): Promise<PaginatedResponse<BorrowRequest>> {
    const response = await api.get<PaginatedResponse<BorrowRequest>>("/api/v1/borrowing/", {
      params,
    });
    return response.data;
  },

  async adminApprove(id: number, payload: ApprovePayload): Promise<void> {
    await api.patch(`/api/v1/borrowing/${id}/`, payload);
  },

  async adminHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<BorrowRequest>> {
    const response = await api.get<PaginatedResponse<BorrowRequest>>(
      "/api/v1/borrowing/history/",
      { params },
    );
    return response.data;
  },

  async adminDeleteRecord(id: number): Promise<void> {
    await api.delete(`/api/v1/borrowing/return/${id}/`);
  },

  async myBorrowings(): Promise<{ total: number; data: BorrowRequest[] }> {
    const response = await api.get<{ total: number; data: BorrowRequest[] }>(
      "/api/v1/borrowing/user/",
    );
    return response.data;
  },

  async submitBorrowRequest(payload: BorrowRequestPayload): Promise<BorrowRequest> {
    const response = await api.post<{ data: BorrowRequest }>(
      "/api/v1/borrowing/user/",
      payload,
    );
    return response.data.data;
  },

  async updatePendingRequest(
    id: number,
    payload: Partial<BorrowRequestPayload>,
  ): Promise<void> {
    await api.patch(`/api/v1/borrowing/user/${id}/`, payload);
  },

  async myReturns(): Promise<{ count: number; data: BorrowRequest[] }> {
    const response = await api.get<{ count: number; data: BorrowRequest[] }>(
      "/api/v1/borrowing/return/",
    );
    return response.data;
  },

  async submitReturn(borrowId: number): Promise<BorrowRequest> {
    const response = await api.post<{ data: BorrowRequest }>(
      `/api/v1/borrowing/return/${borrowId}/`,
    );
    return response.data.data;
  },

  async cancelReturn(id: number): Promise<BorrowRequest> {
    const response = await api.delete<{ data: BorrowRequest }>(
      `/api/v1/borrowing/return/${id}/`,
    );
    return response.data.data;
  },

  async adminConfirmReturn(id: number): Promise<BorrowRequest> {
    const response = await api.patch<{ data: BorrowRequest }>(
      `/api/v1/borrowing/return/${id}/`,
    );
    return response.data.data;
  },
};
