import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { useBIStore } from "./lib/store";

export default function App() {
  const restoreEnvironment = useBIStore((s) => s.restoreEnvironment);

  useEffect(() => {
    restoreEnvironment();
  }, [restoreEnvironment]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
