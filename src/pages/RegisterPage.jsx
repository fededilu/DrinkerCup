import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleIcon from '../components/GoogleIcon.jsx';
import { loginWithGoogle, registerWithEmail } from '../services/authService.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerWithEmail({
        email,
        password,
        firstName,
        lastName,
      });
      navigate('/', { replace: true });
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError.code));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleRegister() {
    setError('');
    setIsGoogleSubmitting(true);

    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError.code));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <section className="authPanel">
      <h1>Registrati</h1>
      <form className="authForm" onSubmit={handleSubmit}>
        <label>
          Nome
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
        </label>

        <label>
          Cognome
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </label>

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
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        <label>
          Conferma password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creazione...' : 'Crea account'}
        </button>
      </form>

      <div className="authDivider" aria-hidden="true">
        <span>oppure</span>
      </div>

      <button
        className="googleButton"
        type="button"
        onClick={handleGoogleRegister}
        disabled={isGoogleSubmitting}
      >
        <GoogleIcon />
        {isGoogleSubmitting ? 'Registrazione con Google...' : 'Registrati con Google'}
      </button>

      <p className="authSwitch">
        Hai gia un account? <Link to="/login">Accedi</Link>
      </p>
    </section>
  );
}

function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Esiste gia un account con questa email.';
    case 'auth/invalid-email':
      return 'Email non valida.';
    case 'auth/weak-password':
      return 'La password deve contenere almeno 6 caratteri.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Accesso con Google annullato.';
    case 'auth/account-exists-with-different-credential':
      return 'Esiste gia un account con questa email. Accedi con il metodo usato in precedenza.';
    case 'permission-denied':
      return 'Account creato, ma salvataggio profilo non autorizzato. Controlla le regole Firestore.';
    default:
      return 'Registrazione non riuscita. Riprova.';
  }
}
