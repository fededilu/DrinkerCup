import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../services/authService.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerWithEmail(email, password);
      navigate('/', { replace: true });
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError.code));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="authPanel">
      <h1>Registrati</h1>
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
    default:
      return 'Registrazione non riuscita. Riprova.';
  }
}
