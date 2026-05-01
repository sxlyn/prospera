import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import BiAnalytics from './pages/BiAnalytics';
import Index from './pages/Index';
import SmartPredict from './pages/SmartPredict';

const pageFromHash = (hash) => {
    const value = hash.replace('#', '');
    if (value === 'bi-analytics' || value === 'smart-predict') return value;
    return 'index';
};

function App() {
    const [currentPage, setCurrentPage] = useState(() => pageFromHash(window.location.hash));

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPage(pageFromHash(window.location.hash));
        };

        window.addEventListener('hashchange', handleHashChange);
        if (!window.location.hash) {
            window.location.hash = 'index';
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleNavigate = (pageId) => {
        window.location.hash = pageId;
        setCurrentPage(pageId);
    };

    return (
        <>
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
            <main className="main-content">
                {currentPage === 'index' && <Index />}
                {currentPage === 'bi-analytics' && <BiAnalytics />}
                {currentPage === 'smart-predict' && <SmartPredict />}
            </main>
        </>
    );
}

export default App;
