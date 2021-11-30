import { Link, Outlet } from "remix";

export default function App() {
  return (
    <div>
      <Link to="login">Login</Link>
      <Outlet />
    </div>
  );
}
