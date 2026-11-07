import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoutes";

import Home from "./pages/home";
import Marketplace from "./pages/marketplace/Marketplace";
import MyGigs from "./pages/gig/MyGigs";
import GigDetails from "./pages/gig/GigDetails";
import CreateGig from "./pages/gig/CreateGig";
import EditGig from "./pages/gig/EditGig";
import Dashboard from "./pages/dashboard/Dashboard";
import Bookings from "./pages/bookings/Bookings";
import NewBooking from "./pages/bookings/NewBooking";
import Transactions from "./pages/transactions/Transactions";
import Income from "./pages/transactions/Income";
import Profile from "./pages/profile/Profile";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/auth/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEditUser from "./pages/admin/AdminEditUser";
import AdminGigs from "./pages/admin/AdminGigs";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminApiUsage from "./pages/admin/AdminApiUsage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>

        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/gigs/:id" element={<GigDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<Bookings />} />       
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Client", "Freelancer"]} />}>
            <Route path="/transactions" element={<Transactions />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Client"]} />}>
            <Route path="/bookings/new" element={<NewBooking />} />
          </Route>
        </Route>


        {/* Freelancer only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Freelancer"]} />}>
            <Route path="/my-gigs" element={<MyGigs />} />
            <Route path="/create-gig" element={<CreateGig />} />
            <Route path="/gigs/:id/edit" element={<EditGig />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
          </Route>
        </Route>

        {/* Admin route */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />}/>
            <Route path="/admin/analytics" element={<AdminAnalytics />}/>
            <Route path="/admin/api-usage" element={<AdminApiUsage />}/>
            <Route path="/admin/bookings" element={<AdminBookings />}/>
            <Route path="/admin/gigs" element={<AdminGigs />}/>
            <Route path="/admin/users" element={<AdminUsers />}/>
            <Route path="/admin/users/:id/edit" element={<AdminEditUser />} />

          </Route>
        </Route>

        {/* Unknown page */}
        <Route path="*" element={<NotFound />} />

      </Route>
    </Routes>
  );
}

export default App;
