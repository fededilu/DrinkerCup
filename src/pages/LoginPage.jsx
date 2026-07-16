import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../services/authService.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || '/';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await loginWithEmail(email, password);
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError.code));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="authPanel">
      <h1>Accedi</h1>
      <form className="authForm" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            minLength={6}
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Accesso...' : 'Accedi'}
        </button>
      </form>

      <p className="authSwitch">
        Non hai un account? <Link to="/register">Registrati</Link>
      </p>
    </section>
  );
}

function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Email non valida.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email o password non corretti.';
    default:
      return 'Accesso non riuscito. Riprova.';
  }
}
