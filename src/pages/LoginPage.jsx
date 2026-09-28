import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GoogleIcon from '../components/GoogleIcon.jsx';
import {
  loginWithEmail,
  loginWithGoogle,
  resetPassword,
} from '../services/authService.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || '/';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
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

  async function handleGoogleLogin() {
    setError('');
    setMessage('');
    setIsGoogleSubmitting(true);

    try {
      await loginWithGoogle();
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError.code));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Inserisci la tua email per recuperare la password.');
      return;
    }

    setIsResetSubmitting(true);

    try {
      await resetPassword(email.trim());
      setMessage('Ti abbiamo inviato un link per reimpostare la password.');
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError.code));
    } finally {
      setIsResetSubmitting(false);
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

        <button
          className="textButton"
          type="button"
          onClick={handlePasswordReset}
          disabled={isResetSubmitting}
        >
          {isResetSubmitting ? 'Invio email...' : 'Password dimenticata?'}
        </button>

        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Accesso...' : 'Accedi'}
        </button>
      </form>

      <div className="authDivider" aria-hidden="true">
        <span>oppure</span>
      </div>

      <button
        className="googleButton"
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleSubmitting}
      >
        <GoogleIcon />
        {isGoogleSubmitting ? 'Accesso con Google...' : 'Accedi con Google'}
      </button>

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
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Accesso con Google annullato.';
    case 'auth/popup-blocked':
      return 'Il browser ha bloccato il popup di Google. Consenti i popup per questo sito e riprova.';
    case 'auth/operation-not-allowed':
      return 'Accesso con Google non abilitato in Firebase Authentication.';
    case 'auth/unauthorized-domain':
      return 'Dominio non autorizzato in Firebase Authentication. Aggiungi il dominio del sito negli Authorized domains.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email o password non corretti.';
    case 'permission-denied':
      return 'Login riuscito, ma salvataggio profilo non autorizzato. Controlla le regole Firestore.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova piu tardi.';
    default:
      return 'Accesso non riuscito. Riprova.';
  }
}
