import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import { AuthProvider } from '@/core/contexts/AuthContext.tsx'
import { RoleProvider } from '@/core/contexts/RoleContext.tsx'
import { AppRouter } from '@/shell/AppRouter'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RoleProvider>
            <AppRouter />
            <Toaster position="top-center" richColors />
          </RoleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)