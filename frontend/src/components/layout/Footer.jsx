// ============================================================
// src/components/layout/Footer.jsx
// ============================================================
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
  const { hotel } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--color-primary)', color: 'white', paddingTop: '5rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', paddingBottom: '4rem' }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {hotel?.name || 'Grand Lumière'}
            </div>
            <p style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', color: 'var(--color-secondary)',
              fontSize: '0.9rem', opacity: 1, marginBottom: '1.25rem' }}>
              {hotel?.tagline || 'Where Luxury Meets Serenity'}
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.8, color: 'white' }}>
              {hotel?.address && <>{hotel.address}<br /></>}
              {hotel?.city && hotel?.country && <>{hotel.city}, {hotel.country}</>}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {[
                { href: hotel?.facebook_url, icon: 'f', label: 'Facebook' },
                { href: hotel?.instagram_url, icon: '◻', label: 'Instagram' },
                { href: hotel?.twitter_url, icon: 'X', label: 'Twitter' },
              ].filter(s => s.href).map(({ href, icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.8rem', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--color-secondary)'; e.target.style.color = 'var(--color-secondary)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = 'white'; }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <FooterHeading>Explore</FooterHeading>
            {[
              ['Rooms & Suites', '/rooms'],
              ['Dining', '/amenities'],
              ['Spa & Wellness', '/amenities'],
              ['Events & Meetings', '/amenities'],
              ['Experiences', '/blog'],
            ].map(([label, href]) => (
              <FooterLink key={label} href={href}>{label}</FooterLink>
            ))}
          </div>

          {/* Guest Services */}
          <div>
            <FooterHeading>Guest Services</FooterHeading>
            {[
              ['Book a Room', '/book'],
              ['My Reservations', '/dashboard'],
              ['Check-In Online', '/dashboard'],
              ['Concierge', '/amenities'],
              ['Contact Us', '/contact'],
            ].map(([label, href]) => (
              <FooterLink key={label} href={href}>{label}</FooterLink>
            ))}
          </div>

          {/* Contact */}
          <div>
            <FooterHeading>Get in Touch</FooterHeading>
            {hotel?.phone && (
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-secondary)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Phone</span>
                {hotel.phone}
              </p>
            )}
            {hotel?.email && (
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-secondary)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Email</span>
                {hotel.email_reservations || hotel.email}
              </p>
            )}
            {hotel?.check_in_time && (
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '1rem' }}>
                <span style={{ color: 'var(--color-secondary)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Check-in / Check-out</span>
                {hotel.check_in_time?.slice(0,5)} / {hotel.check_out_time?.slice(0,5)}
              </p>
            )}
          </div>
        </div>

        {/* Gold Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-secondary), transparent)', opacity: 0.4 }} />

        {/* Bottom Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
          gap: '1rem', padding: '1.5rem 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
          <span>© {year} {hotel?.name || 'Grand Lumière Hotel'}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(t => (
              <Link key={t} to="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
                transition: 'color 0.3s' }}
                onMouseEnter={e => e.target.style.color = 'var(--color-secondary)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', letterSpacing: '0.2em',
      textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: '1.25rem', fontWeight: 500 }}>
      {children}
    </div>
  );
}

function FooterLink({ href, children }) {
  return (
    <Link to={href} style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem',
      marginBottom: '0.625rem', transition: 'all 0.3s', paddingLeft: '0.75rem',
      borderLeft: '1px solid transparent' }}
      onMouseEnter={e => { e.target.style.color = 'white'; e.target.style.borderLeftColor = 'var(--color-secondary)'; e.target.style.paddingLeft = '1rem'; }}
      onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.65)'; e.target.style.borderLeftColor = 'transparent'; e.target.style.paddingLeft = '0.75rem'; }}>
      {children}
    </Link>
  );
}
