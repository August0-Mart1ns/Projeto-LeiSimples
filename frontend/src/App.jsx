import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import PrivateRoute from '@/components/layout/PrivateRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Cadastro from '@/pages/Cadastro'
import EsqueciSenha from '@/pages/EsqueciSenha'
import RedefinirSenha from '@/pages/RedefinirSenha'
import Perfil from '@/pages/Perfil'
import Legal from '@/pages/Legal'
import Artigos from '@/pages/Artigos'
import ArtigoDetalhe from '@/pages/ArtigoDetalhe'
import PainelCidadao from '@/pages/cidadao/PainelCidadao'
import Analise from '@/pages/cidadao/Analise'
import Resultado from '@/pages/cidadao/Resultado'
import Advogados from '@/pages/cidadao/Advogados'
import Confirmacao from '@/pages/cidadao/Confirmacao'
import LoginAdvogado from '@/pages/advogado/LoginAdvogado'
import PainelAdvogado from '@/pages/advogado/PainelAdvogado'
import PainelAdmin from '@/pages/admin/PainelAdmin'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/advogado/login" element={<LoginAdvogado />} />
        <Route path="/artigos" element={<Artigos />} />
        <Route path="/artigos/:slug" element={<ArtigoDetalhe />} />
        <Route path="/termos" element={<Legal tipo="termos" />} />
        <Route path="/privacidade" element={<Legal tipo="privacidade" />} />
        <Route path="/aviso-ia" element={<Legal tipo="aviso-ia" />} />

        <Route element={<PrivateRoute tipo="cidadao" />}>
          <Route path="/painel" element={<PainelCidadao />} />
          <Route path="/analisar" element={<Analise />} />
          <Route path="/resultado" element={<Resultado />} />
          <Route path="/advogados" element={<Advogados />} />
          <Route path="/confirmacao" element={<Confirmacao />} />
        </Route>

        <Route element={<PrivateRoute tipo="advogado" />}>
          <Route path="/advogado/painel" element={<PainelAdvogado />} />
        </Route>

        <Route element={<PrivateRoute tipo="admin" />}>
          <Route path="/admin/painel" element={<PainelAdmin />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
