declare module 'next-themes' {
  import { ReactNode } from 'react'
  
  export interface ThemeProviderProps {
    children: ReactNode
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    [key: string]: any
  }
  
  export const ThemeProvider: React.ComponentType<ThemeProviderProps>
  export function useTheme(): {
    theme: string | undefined
    setTheme: (theme: string) => void
    resolvedTheme: string | undefined
    themes: string[]
    systemTheme: string | undefined
  }
}
declare module "react-day-picker";
declare module 'recharts' {
  export interface LegendProps {
    payload?: any[]
    verticalAlign?: 'top' | 'middle' | 'bottom'
    [key: string]: any
  }
  
  export const Legend: React.ComponentType<LegendProps>
  export const ResponsiveContainer: React.ComponentType<any>
  export const LineChart: React.ComponentType<any>
  export const BarChart: React.ComponentType<any>
  export const XAxis: React.ComponentType<any>
  export const YAxis: React.ComponentType<any>
  export const CartesianGrid: React.ComponentType<any>
  export const Tooltip: React.ComponentType<any>
  export const Line: React.ComponentType<any>
  export const Bar: React.ComponentType<any>
  export const Cell: React.ComponentType<any>
  export const PieChart: React.ComponentType<any>
  export const Pie: React.ComponentType<any>
  export const AreaChart: React.ComponentType<any>
  export const Area: React.ComponentType<any>
}
declare module "vaul";
declare module "react-resizable-panels";
declare module 'input-otp' {
  export interface InputOTPSlot {
    char: string | null
    hasFakeCaret: boolean
    isActive: boolean
  }
  
  export interface InputOTPContext {
    slots: InputOTPSlot[]
  }
  
  export const OTPInput: any
  export const OTPInputContext: React.Context<InputOTPContext>
}