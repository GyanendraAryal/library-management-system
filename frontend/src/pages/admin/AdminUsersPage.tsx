import { useEffect, useState } from "react";
import { authService } from "../../services/authService";
import type { User } from "../../types";
import Alert from "../../components/ui/Alert";
import { isApiError } from "../../utils/errors";
import { formatDate } from "../../utils/media";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await authService.listUsers();
        setUsers(response.data);
      } catch (err) {
        setError(isApiError(err) ? err.message : "Unable to load members.");
      }
    };
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12 max-md:px-4">
      <h1 className="font-serif text-3xl font-semibold">Members</h1>
      <p className="mt-2 text-sm text-ink-muted">Read-only directory from GET /auth/users/.</p>
      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-4 py-3">{user.email || "—"}</td>
                <td className="px-4 py-3">{user.is_staff ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(user.date_joined)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
