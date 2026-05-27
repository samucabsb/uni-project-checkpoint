/**
 * Roteamento — Checkpoint v1.5
 * Perfis e listas são públicos (sem necessidade de login para ver)
 */

import { Route, Routes } from 'react-router-dom';
import { Layout, Private, AdminOnly } from './components/Layout';
import Landing             from './pages/Landing';
import { Login, Register } from './pages/auth';
import Feed                from './pages/feed/Feed';
import Games               from './pages/games/Games';
import GameDetails         from './pages/games/GameDetails';
import Library             from './pages/library/Library';
import { Lists }           from './pages/lists/Lists';
import { ListDetails }     from './pages/lists/ListDetails';
import Profile             from './pages/profile/Profile';
import AdminPage           from './pages/admin/Admin';
import NotFound            from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"           element={<Landing />}     />
        <Route path="/login"      element={<Login />}       />
        <Route path="/cadastro"   element={<Register />}    />
        <Route path="/feed"       element={<Feed />}        />
        <Route path="/jogos"      element={<Games />}       />
        <Route path="/jogos/:id"  element={<GameDetails />} />
        <Route path="/listas"     element={<Lists />}       />
        <Route path="/listas/:id" element={<ListDetails />} />
        <Route path="/usuarios/:id" element={<Profile />}   />   {/* público */}
        <Route path="/biblioteca"   element={<Private><Library /></Private>} />
        <Route path="/admin"        element={<AdminOnly><Private><AdminPage /></Private></AdminOnly>} />
        <Route path="*"             element={<NotFound />}  />
      </Route>
    </Routes>
  );
}
