import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "./components/layout/Home";
import {
  GuestRoute,
  ProtectedRoute,
  StaffRoute,
} from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import AboutPage from "./pages/AboutPage";
import CataloguePage from "./pages/CataloguePage";
import BookDetailPage from "./pages/BookDetailPage";
import MyBorrowingsPage from "./pages/MyBorrowingsPage";
import ProfilePage from "./pages/ProfilePage";
import ManageBooksPage from "./pages/admin/ManageBooksPage";
import ManageAuthorsPage from "./pages/admin/ManageAuthorsPage";
import AdminRequestsPage from "./pages/admin/AdminRequestsPage";
import AdminHistoryPage from "./pages/admin/AdminHistoryPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAppDispatch, useAuth } from "./hooks/useAuth";
import { authService } from "./services/authService";
import { clearCredentials, updateUser } from "./store/authSlice";
import { isApiError } from "./utils/errors";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "about", Component: AboutPage },
      {
        Component: GuestRoute,
        children: [{ path: "login", Component: Login }],
      },
      {
        Component: ProtectedRoute,
        children: [
          { path: "catalogue", Component: CataloguePage },
          { path: "books/:id", Component: BookDetailPage },
          { path: "borrowings", Component: MyBorrowingsPage },
          { path: "returns", Component: MyBorrowingsPage },
          { path: "profile", Component: ProfilePage },
          { path: "admin/authors", Component: ManageAuthorsPage },
        ],
      },
      {
        Component: StaffRoute,
        children: [
          { path: "admin/books", Component: ManageBooksPage },
          { path: "admin/requests", Component: AdminRequestsPage },
          { path: "admin/history", Component: AdminHistoryPage },
          { path: "admin/users", Component: AdminUsersPage },
        ],
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

function AuthBootstrap() {
  const { token } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authService
      .getProfile()
      .then((user) => {
        if (!cancelled) dispatch(updateUser(user));
      })
      .catch((error) => {
        if (!cancelled && isApiError(error) && error.status === 401) {
          dispatch(clearCredentials());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, dispatch]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return <AuthBootstrap />;
}
