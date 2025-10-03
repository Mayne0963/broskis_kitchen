import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { verifyIdToken } from '@/lib/auth/session';
import { cookies } from 'next/headers';

/**
 * Higher-order function that wraps getServerSideProps to enforce admin access
 * Redirects non-admin users to the dashboard
 */
export function withAdmin<P extends { [key: string]: any } = { [key: string]: any }>(
  getServerSideProps?: GetServerSideProps<P>
) {
  return async (context: GetServerSidePropsContext) => {
    try {
      // Get the session token from cookies
      const sessionCookie = context.req.cookies.session;
      
      if (!sessionCookie) {
        console.log('No session cookie found, redirecting to login');
        return {
          redirect: {
            destination: '/login?redirect=/admin',
            permanent: false,
          },
        };
      }

      // Verify the ID token and get user claims
      const decodedToken = await verifyIdToken(sessionCookie);
      
      if (!decodedToken) {
        console.log('Invalid session token, redirecting to login');
        return {
          redirect: {
            destination: '/login?redirect=/admin',
            permanent: false,
          },
        };
      }

      // Check if user has admin role
      const userRole = decodedToken.role;
      const isAdmin = userRole === 'admin' || decodedToken.admin === true;
      
      if (!isAdmin) {
        console.log(`User ${decodedToken.email} does not have admin role (role: ${userRole}), redirecting to dashboard`);
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          },
        };
      }

      console.log(`Admin access granted for ${decodedToken.email}`);
      
      // If user is admin, proceed with the original getServerSideProps
      if (getServerSideProps) {
        const result = await getServerSideProps(context);
        
        // Add user info to props if the result contains props
        if ('props' in result) {
          return {
            ...result,
            props: {
              ...result.props,
              user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: decodedToken.role,
                admin: decodedToken.admin,
                permissions: decodedToken.permissions || [],
              },
            },
          };
        }
        
        return result;
      }
      
      // Default props with user info
      return {
        props: {
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role,
            admin: decodedToken.admin,
            permissions: decodedToken.permissions || [],
          },
        } as P,
      };
    } catch (error) {
      console.error('Error in withAdmin middleware:', error);
      
      // On any error, redirect to login
      return {
        redirect: {
          destination: '/login?error=auth_error&redirect=/admin',
          permanent: false,
        },
      };
    }
  };
}

/**
 * Alternative implementation for App Router (if needed)
 * This can be used with the new app directory structure
 */
export async function checkAdminAccess(request: Request): Promise<{
  isAdmin: boolean;
  user?: any;
  redirectUrl?: string;
}> {
  try {
    // Extract session cookie from request headers
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return {
        isAdmin: false,
        redirectUrl: '/login?redirect=/admin',
      };
    }

    // Parse session cookie
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    const sessionCookie = sessionMatch ? sessionMatch[1] : null;
    
    if (!sessionCookie) {
      return {
        isAdmin: false,
        redirectUrl: '/login?redirect=/admin',
      };
    }

    // Verify token
    const decodedToken = await verifyIdToken(sessionCookie);
    
    if (!decodedToken) {
      return {
        isAdmin: false,
        redirectUrl: '/login?redirect=/admin',
      };
    }

    // Check admin role
    const isAdmin = decodedToken.role === 'admin' || decodedToken.admin === true;
    
    if (!isAdmin) {
      return {
        isAdmin: false,
        redirectUrl: '/dashboard',
      };
    }

    return {
      isAdmin: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role,
        admin: decodedToken.admin,
        permissions: decodedToken.permissions || [],
      },
    };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return {
      isAdmin: false,
      redirectUrl: '/login?error=auth_error&redirect=/admin',
    };
  }
}

export default withAdmin;