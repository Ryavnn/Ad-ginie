
import './App.css'
import AdGenieDashboard from './pages/Dashboard';
import Dashboard from './pages/Dashboard';
import AdGenieAuth from './pages/login'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import NotificationProvider from './components/NotificationProvider';

function App() {

  return (
    <>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AdGenieAuth />} />
            <Route path="/dashboard" element={<AdGenieDashboard />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </>
  );
}

export default App
