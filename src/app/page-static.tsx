import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Broski\'s Kitchen - Luxury Street Gourmet',
  description: 'Experience luxury street gourmet with Broski\'s Kitchen - where flavor meets culture.',
};

export default function StaticPage() {
  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: 0,
        padding: 0,
        display: 'block',
        visibility: 'visible',
        opacity: 1
      }}
    >
      {/* Navigation */}
      <nav 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          padding: '16px 0',
          borderBottom: '1px solid #333'
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px'
          }}
        >
          <h1 
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#FFD700',
              margin: 0
            }}
          >
            Broski's Kitchen
          </h1>
          <div 
            style={{
              display: 'flex',
              gap: '32px'
            }}
          >
            <a 
              href="#home" 
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#FFD700'}
              onMouseOut={(e) => e.currentTarget.style.color = '#ffffff'}
            >
              Home
            </a>
            <a 
              href="#menu" 
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#FFD700'}
              onMouseOut={(e) => e.currentTarget.style.color = '#ffffff'}
            >
              Menu
            </a>
            <a 
              href="#about" 
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#FFD700'}
              onMouseOut={(e) => e.currentTarget.style.color = '#ffffff'}
            >
              About
            </a>
            <a 
              href="#contact" 
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#FFD700'}
              onMouseOut={(e) => e.currentTarget.style.color = '#ffffff'}
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="home"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 24px 60px',
          background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 1) 70%)'
        }}
      >
        <div 
          style={{
            maxWidth: '800px',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <h1 
            style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 'bold',
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1
            }}
          >
            Broski's Kitchen
          </h1>
          <h2 
            style={{
              fontSize: 'clamp(24px, 4vw, 48px)',
              marginBottom: '32px',
              color: '#ffffff',
              fontWeight: 'normal'
            }}
          >
            Luxury Street Gourmet
          </h2>
          <p 
            style={{
              fontSize: '20px',
              marginBottom: '48px',
              color: '#cccccc',
              maxWidth: '600px',
              margin: '0 auto 48px',
              lineHeight: 1.6
            }}
          >
            Where flavor meets culture. Experience the finest street gourmet cuisine 
            crafted with passion and served with style.
          </p>
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <button 
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#000000',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '200px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Order Now
            </button>
            <button 
              style={{
                border: '2px solid #FFD700',
                color: '#FFD700',
                background: 'transparent',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '200px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#FFD700';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#FFD700';
              }}
            >
              View Menu
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="about"
        style={{
          padding: '80px 24px',
          backgroundColor: '#111111'
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          <h2 
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '64px',
              color: '#FFD700'
            }}
          >
            Why Choose Broski's Kitchen?
          </h2>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px'
            }}
          >
            <div 
              style={{
                textAlign: 'center',
                padding: '32px',
                border: '2px solid #FFD700',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 215, 0, 0.05)'
              }}
            >
              <h3 
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#FFD700'
                }}
              >
                Premium Quality
              </h3>
              <p 
                style={{
                  color: '#cccccc',
                  fontSize: '16px',
                  lineHeight: 1.6
                }}
              >
                Only the finest ingredients and authentic recipes for an exceptional dining experience.
              </p>
            </div>
            <div 
              style={{
                textAlign: 'center',
                padding: '32px',
                border: '2px solid #FFD700',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 215, 0, 0.05)'
              }}
            >
              <h3 
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#FFD700'
                }}
              >
                Fast Delivery
              </h3>
              <p 
                style={{
                  color: '#cccccc',
                  fontSize: '16px',
                  lineHeight: 1.6
                }}
              >
                Quick and reliable delivery service to bring our gourmet food right to your door.
              </p>
            </div>
            <div 
              style={{
                textAlign: 'center',
                padding: '32px',
                border: '2px solid #FFD700',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 215, 0, 0.05)'
              }}
            >
              <h3 
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: '#FFD700'
                }}
              >
                Unique Flavors
              </h3>
              <p 
                style={{
                  color: '#cccccc',
                  fontSize: '16px',
                  lineHeight: 1.6
                }}
              >
                Innovative fusion of street food culture with luxury dining standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Preview Section */}
      <section 
        id="menu"
        style={{
          padding: '80px 24px',
          backgroundColor: '#000000'
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <h2 
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '32px',
              color: '#FFD700'
            }}
          >
            Our Signature Dishes
          </h2>
          <p 
            style={{
              fontSize: '20px',
              color: '#cccccc',
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px'
            }}
          >
            Discover our carefully crafted menu featuring the perfect blend of street food culture and luxury dining.
          </p>
          <button 
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#000000',
              padding: '16px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Explore Full Menu
          </button>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact"
        style={{
          padding: '80px 24px',
          backgroundColor: '#111111'
        }}
      >
        <div 
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <h2 
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '32px',
              color: '#FFD700'
            }}
          >
            Get In Touch
          </h2>
          <p 
            style={{
              fontSize: '18px',
              color: '#cccccc',
              marginBottom: '32px'
            }}
          >
            Ready to experience luxury street gourmet? Contact us for orders, catering, or inquiries.
          </p>
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center'
            }}
          >
            <button 
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#000000',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '200px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Call Now
            </button>
            <p 
              style={{
                color: '#888888',
                fontSize: '14px'
              }}
            >
              Available for delivery, pickup, and catering
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        style={{
          backgroundColor: '#000000',
          padding: '48px 24px',
          borderTop: '1px solid #333'
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <h3 
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#FFD700'
            }}
          >
            Broski's Kitchen
          </h3>
          <p 
            style={{
              color: '#888888',
              marginBottom: '16px',
              fontSize: '18px'
            }}
          >
            Luxury Street Gourmet
          </p>
          <p 
            style={{
              color: '#666666',
              fontSize: '14px'
            }}
          >
            © 2024 Broski's Kitchen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

