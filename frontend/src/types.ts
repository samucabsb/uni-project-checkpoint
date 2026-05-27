// Tipos compartilhados — Checkpoint v1.5

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
  estatisticas?: { zerados: number; jogando: number; quero_jogar: number; favoritos: number };
};

export type Jogo = {
  id_jogo:               number;
  nm_jogo:               string;
  img_jogo:              string;
  genero?:               string | null;
  plataforma?:           string | null;
  classificacao?:        string | null;
  descricao?:            string | null;
  dt_jogo:               string;
  media?:                number;              // escala 0.5-5.0 (display)
  total_avaliacoes?:     number;
  avaliacoes?:           Avaliacao[];
  _count?:               { status_jogos: number };
  distribuicao_notas?:   Record<number, number>; // chave: 1-10
};

export type Avaliacao = {
  id_avaliacao: number;
  id_usuario:   number;
  id_jogo:      number;
  nota:          number;                      // 1-10 (interno)
  comentario?:   string | null;               // v1.5: opcional
  data_jogada?:  string | null;
  created_at:    string;
  usuario?:      Pick<Usuario, 'id_usuario' | 'nm_usuario' | 'img_usuario'>;
  jogo?:         Jogo;
  likes_count?:  number;                      // v1.5
  ja_curtiu?:    boolean;                     // v1.5
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
  status:        'QUERO_JOGAR' | 'JOGANDO' | 'ZERADO' | 'ABANDONADO';
  favorito:      boolean;
  top_position:  number | null;
  jogo:          Jogo;
};

export type DiscoverData = {
  reviews: Avaliacao[];
  lists:   Lista[];
  games:   Jogo[];
  users:   UsuarioCard[];
};

export type UsuarioCard = Pick<Usuario, 'id_usuario' | 'nm_usuario' | 'img_usuario' | 'bio_usuario' | '_count'>;
