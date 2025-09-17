interface SessionGateProps {
  children: React.ReactNode
}

// No-op passthrough component - middleware handles all auth protection
export default function SessionGate({ children }: SessionGateProps) {
  return <>{children}</>
}