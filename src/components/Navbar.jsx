import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout, subscribeToAuthChanges } from '../services/authService.js';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => subscribeToAuthChanges(setUser), []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        Drinker Cup
      </Link>

      <nav className="navLinks" aria-label="Navigazione principale">
        {user ? (
          <>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/profile">Profilo</NavLink>
            <button className="linkButton" type="button" onClick={handleLogout}>
              Esci
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Registrati</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
