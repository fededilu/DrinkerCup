import { Link } from 'react-router-dom';

const contactEmail = 'federicodiluzio69@gmail.com';
const instagramUrl = 'https://www.instagram.com/fede.dilu';

export default function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerColumn">
        <h2>Contatti</h2>
        <p>Federico Di Luzio</p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </div>

      <div className="footerColumn">
        <h2>Social</h2>
        <a href={instagramUrl} target="_blank" rel="noreferrer">
          Instagram
        </a>
      </div>

      <div className="footerColumn">
        <h2>Info</h2>
        <Link to="/spiegazione">Come funziona</Link>
      </div>
    </footer>
  );
}
