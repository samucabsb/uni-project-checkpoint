// Tipos compartilhados do Checkpoint v1.4

export type Usuario = {
  id_usuario:    number;
  nm_usuario:    string;
  email_usuario: string;
  tipo_usuario:  'USER' | 'ADMIN';
  bio_usuario?:  string | null;
  img_usuario?:  string | null;
  isFollowing?:  boolean;
  _count?: { seguidores: number; seguindo: number; avaliacoes: number; listas: number };
  avaliacoes?:  Avaliacao[];
  listas?:      Lista[];
  status_jogos?: StatusJogo[];
};

export type Jogo = {
  id_jogo:          number;
  nm_jogo:          string;
  img_jogo:         string;
  genero?:          string | null;
  plataforma?:      string | null;
  classificacao?:   string | null;
  descricao?:       string | null;
  dt_jogo:          string;
  media?:           number;
  total_avaliacoes?: number;
  avaliacoes?:      Avaliacao[];
  _count?:          { status_jogos: number };
};

export type Avaliacao = {
  id_avaliacao: number;
  id_usuario:   number;
  id_jogo:      number;
  nota:         number;
  comentario:   string;
  data_jogada?: string | null;
  created_at:   string;
  usuario?:     Pick<Usuario, 'id_usuario' | 'nm_usuario' | 'img_usuario'>;
  jogo?:        Jogo;
};

export type Lista = {
  id_lista:   number;
  id_usuario: number;
  nm_lista:   string;
  descricao?: string | null;
  publica:    boolean;
  created_at: string;
  usuario?:   Pick<Usuario, 'id_usuario' | 'nm_usuario' | 'img_usuario'>;
  jogos?:     { jogo: Jogo }[];
};

export type StatusJogo = {
  id_status:    number;
  id_usuario:   number;
  id_jogo:      number;
  status:       'QUERO_JOGAR' | 'JOGANDO' | 'ZERADO' | 'ABANDONADO';
  favorito:     boolean;
  top_position: number | null;  // 1-4 → posição na Vitrine; null → não está na Vitrine
  jogo:         Jogo;
};

// Payload do /feed/discover — v1.4: inclui users
export type DiscoverData = {
  reviews: Avaliacao[];
  lists:   Lista[];
  games:   Jogo[];
  users:   Pick<Usuario, 'id_usuario' | 'nm_usuario' | 'img_usuario' | 'bio_usuario' | '_count'>[];
};

// Usuário resumido para busca e cards
export type UsuarioCard = Pick<Usuario, 'id_usuario' | 'nm_usuario' | 'img_usuario' | 'bio_usuario' | '_count'>;
