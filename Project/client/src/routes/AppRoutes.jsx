import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "../components/layout/Layout";

import Home from "../Home";
import Marketplace from "../pages/Marketplace";
import Dashboard from "../pages/Dashboard";
import Bookings from "../pages/Bookings";
import Transactions from "../pages/Transactions";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import GigDetails from "../pages/GigDetails";
import CreateGig from "../pages/CreateGig";
import NotFound from "../pages/NotFound";

function AppRoutes() {
    return (
        <BrowserRouter>

            <Routes>

                <Route element={<Layout />}>

                    <Route path="/" element={<Home />} />

                    <Route path="/marketplace" element={<Marketplace />} />

                    <Route path="/gigs/:id" element={<GigDetails />} />

                    <Route path="/create-gig" element={<CreateGig />} />

                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/bookings" element={<Bookings />} />

                    <Route path="/transactions" element={<Transactions />} />

                    <Route path="/profile" element={<Profile />} />

                    <Route path="/login" element={<Login />} />

                    <Route path="/signup" element={<Signup />} />

                    <Route path="*" element={<NotFound />} />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default AppRoutes;