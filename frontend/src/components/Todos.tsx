interface Todo {
  id: string | number;
  title: string;
  status: boolean;
}

function Todos() {
  const todos: Todo[] = [
    { id: 1, title: "Learn TypeScript basics", status: true },
    { id: 2, title: "Practice React components", status: false },
  ];
  return (
    <table className="border">
      <thead>
        <tr className="border">
          <td className="border">Title</td>
          <td className="border">Status</td>
        </tr>
      </thead>
      <tbody>
        {todos.map((todo) => (
          <tr key={todo.id}>
            <td className="border px-0.5">{todo.title}</td>
            <td className="border px-0.5">{todo.status ? "yes" : "no"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Todos;
