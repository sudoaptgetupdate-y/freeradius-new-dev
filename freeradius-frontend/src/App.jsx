// src/App.jsx
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Outlet />
    </>
  );
}

export default App;