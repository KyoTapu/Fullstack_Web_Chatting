import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#F5F2EE] text-stone-900">
      <Outlet />
    </div>
  );
};

export default MainLayout;
