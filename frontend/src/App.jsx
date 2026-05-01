import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Protected from './components/Protected';

// Pages from frontend/src
import Index from './pages/Index';
import BiAnalytics from './pages/BiAnalytics';
import SmartPredict from './pages/SmartPredict';

// Pages from prospera-frontend/src
import Login from './pages/Login';
import Products from './pages/Products';
import Transaction from './pages/Transaction';

/**
 * Layout wrapper to conditionally show Sidebar
 */
const Layout = ({ children }) => {
    const location = useLocation();
    const noSidebarPaths = ['/login', '/'];
    const showSidebar = !noSidebarPaths.includes(location.pathname);

    return (
        <>
            {showSidebar && <Sidebar />}
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

                    {/* Protected Routes with Sidebar */}
                    <Route path="/dashboard" element={<Protected><Index /></Protected>} />
                    <Route path="/products" element={<Protected><Products /></Protected>} />
                    <Route path="/transaction" element={<Protected><Transaction /></Protected>} />
                    <Route path="/bi-analytics" element={<Protected><BiAnalytics /></Protected>} />
                    <Route path="/smart-predict" element={<Protected><SmartPredict /></Protected>} />

                    {/* Catch all redirect to login */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
