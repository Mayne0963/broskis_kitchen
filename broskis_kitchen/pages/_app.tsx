import type { AppProps } from 'next/app';
import { RoleProvider } from '@/context/RoleContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RoleProvider>
      <Component {...pageProps} />
    </RoleProvider>
  );
}

export default MyApp;