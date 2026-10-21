import api from "./api";
import type { Author, Book, PaginatedResponse } from "../types";

export interface BookFilters {
  search?: string;
  title?: string;
  author?: string;
  genre?: string;
  page?: number;
  size?: number;
}

export const booksService = {
  async listBooks(filters: BookFilters = {}): Promise<PaginatedResponse<Book>> {
    const response = await api.get<PaginatedResponse<Book>>("/api/v1/books/", {
      params: filters,
    });
    return response.data;
  },

  async getBook(id: number): Promise<Book> {
    const response = await api.get<{ data: Book }>(`/api/v1/books/${id}/`);
    return response.data.data;
  },

  async createBook(payload: FormData): Promise<Book> {
    const response = await api.post<{ data: Book }>("/api/v1/books/", payload);
    return response.data.data;
  },

  async updateBook(id: number, payload: FormData): Promise<Book> {
    const response = await api.put<{ data: Book }>(`/api/v1/books/${id}/`, payload);
    return response.data.data;
  },

  async deleteBook(id: number): Promise<void> {
    await api.delete(`/api/v1/books/${id}/`);
  },

  async listAuthors(): Promise<Author[]> {
    const response = await api.get<{ data: Author[] }>("/api/v1/books/authors/");
    return response.data.data;
  },

  async getAuthor(id: number): Promise<Author> {
    const response = await api.get<{ data: Author }>(`/api/v1/books/authors/${id}/`);
    return response.data.data;
  },

  async createAuthor(payload: {
    author_name: string;
    authors_biography?: string;
  }): Promise<Author> {
    const response = await api.post<{ data: Author }>("/api/v1/books/authors/", payload);
    return response.data.data;
  },

  async updateAuthor(
    id: number,
    payload: { author_name?: string; authors_biography?: string },
  ): Promise<Author> {
    const response = await api.put<{ data: Author }>(
      `/api/v1/books/authors/${id}/`,
      payload,
    );
    return response.data.data;
  },

  async deleteAuthor(id: number): Promise<void> {
    await api.delete(`/api/v1/books/authors/${id}/`);
  },
};
