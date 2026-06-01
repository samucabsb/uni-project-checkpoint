/**
 * Biblioteca — REMOVIDA em v1.9
 * A funcionalidade de biblioteca foi descontinuada.
 * Esta página redireciona para o diário, que agora cobre o histórico de jogos.
 */
import { Navigate } from 'react-router-dom';
export default function Library() { return <Navigate to="/diario" replace />; }
