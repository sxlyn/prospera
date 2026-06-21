import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Protected from './components/Protected';
import TourGuide from './components/TourGuide';

// Pages
import Index from './pages/Index';
import BiAnalytics from './pages/BiAnalytics';
import SmartPredict from './pages/SmartPredict';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Transaction from './pages/Transaction';
import UserManagement from './pages/UserManagement';
import StoreSettings from './pages/StoreSettings';

/**
 * Layout wrapper to conditionally show Sidebar
 */
const Layout = ({ children }) => {
    const location = useLocation();
    const noSidebarPaths = ['/login', '/register', '/'];
    const showSidebar = !noSidebarPaths.includes(location.pathname);

    return (
        <>
            {showSidebar && <Sidebar />}
            {showSidebar && <TourGuide />}
            <main className={showSidebar ? "main-content" : ""}>
                {children}
            </main>
        </>
    );
};

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    {/* Landing Page is Login */}
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes — Semua role */}
                    <Route path="/products" element={<Protected><Products /></Protected>} />
                    <Route path="/categories" element={<Protected><Categories /></Protected>} />
                    <Route path="/transaction" element={<Protected><Transaction /></Protected>} />

                    {/* Protected Routes — Owner only */}
                    <Route path="/dashboard" element={<Protected allowedRoles={['owner']}><Index /></Protected>} />
                    <Route path="/bi-analytics" element={<Protected allowedRoles={['owner']}><BiAnalytics /></Protected>} />
                    <Route path="/smart-predict" element={<Protected allowedRoles={['owner']}><SmartPredict /></Protected>} />
                    <Route path="/user-management" element={<Protected allowedRoles={['owner']}><UserManagement /></Protected>} />
                    <Route path="/settings" element={<Protected allowedRoles={['owner']}><StoreSettings /></Protected>} />

                    {/* Catch all redirect to login */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
