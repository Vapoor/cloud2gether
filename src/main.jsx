import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Lobby from './pages/Lobby.jsx'
import MainPage from './pages/MainPage.jsx'
import Room from './pages/Room.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/app" element={
          <ProtectedRoute>
          <Lobby />
          </ProtectedRoute>
          } 
        />
        <Route path="/room/:code" element={
          <ProtectedRoute>
          <Room/>
          </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
