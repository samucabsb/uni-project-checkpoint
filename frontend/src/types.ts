// ============================================================
// Tipos compartilhados — Checkpoint v1.6
// ============================================================

export type TipoUsuario    = 'USER' | 'ADMIN';
export type StatusJogoEnum = 'QUERO_JOGAR' | 'JOGANDO' | 'ZERADO' | 'ABANDONADO';
export type TipoAtividade  =
  | 'AVALIOU_JOGO' | 'CURTIU_REVIEW' | 'CRIOU_LISTA'
  | 'ADICIONOU_JOGO_LISTA' | 'FAVORITOU_JOGO' | 'MUDOU_STATUS'
  | 'SEGUIU_USUARIO' | 'CURTIU_LISTA';

export type UsuarioCard = {
  id_usuario:  number;
  nm_usuario:  string;
  img_usuario: string | null;
  bio_usuario: string | null;
  _count?:     { avaliacoes: number; seguidores: number };
};

export type Usuario = {
  id_usuario:   number;
  nm_usuario:   string;
  email_usuario:string;
  tipo_usuario: TipoUsuario;
  bio_usuario?: string | null;
  img_usuario?: string | null;
  isFollowing?: boolean;
  _count?:      { seguidores: number; seguindo: number; avaliacoes: number; listas: number };
  avaliacoes?:  Avaliacao[];
  listas?:      Lista[];
  status_jogos?:StatusJogo[];
  estatisticas?:{ zerados: number; jogando: number; quero_jogar: number; favoritos: number };
};

export type Jogo = {
  id_jogo:              number;
  nm_jogo:              string;
  img_jogo:             string;
  genero?:              string | null;
  plataforma?:          string | null;
  classificacao?:       string | null;
  jogadores?:           string | null;  // v1.7
  descricao?:           string | null;
  dt_jogo:              string;
  media?:               number;
  total_avaliacoes?:    number;
  avaliacoes?:          Avaliacao[];
  _count?:              { status_jogos: number };
  distribuicao_notas?:  Record<number, number>;
  listas_com_jogo?:     { id_lista: number; nm_lista: string; usuario: UsuarioCard }[];
};

export type Avaliacao = {
  id_avaliacao:   number;
  id_usuario:     number;
  id_jogo:        number;
  nota:           number;          // 1-10 interno
  comentario?:    string | null;
  data_jogada?:   string | null;
  created_at:     string;
  usuario?:       UsuarioCard;
  jogo?:          Jogo;
  likes_count?:    number;
  dislikes_count?: number;
  comments_count?: number;
  ja_curtiu?:      boolean;  // mantido por compat
  minha_reacao?:   'LIKE' | 'DISLIKE' | null; // v1.7
};

export type Comentario = {
  id_comentario: number;
  id_usuario:    number;
  id_avaliacao:  number;
  texto:         string;
  created_at:    string;
  usuario:       UsuarioCard;
};

export type Lista = {
  id_lista:    number;
  id_usuario:  number;
  nm_lista:    string;
  descricao?:  string | null;
  publica:     boolean;
  created_at:  string;
  usuario?:    UsuarioCard;
  jogos?:      { jogo: Jogo; position?: number | null }[];
  likes_count?:number;
  ja_curtiu?:  boolean;
  _count?:     { likes: number };
};

export type StatusJogo = {
  id_status:   number;
  id_usuario:  number;
  id_jogo:     number;
  status:      StatusJogoEnum;
  favorito:    boolean;
  top_position:number | null;
  jogo:        Jogo;
};

export type Atividade = {
  id_atividade:    number;
  id_usuario:      number;
  tipo:            TipoAtividade;
  id_jogo?:        number | null;
  id_avaliacao?:   number | null;
  id_lista?:       number | null;
  id_usuario_alvo?:number | null;
  dados_extras?:   string | null;
  created_at:      string;
  usuario:         UsuarioCard;
  usuario_alvo?:   UsuarioCard | null;
  jogo?:           Jogo | null;
  avaliacao?:      Avaliacao | null;
  lista?:          Lista | null;
};

export type DiarioEntry = {
  id_diario:   number;
  id_usuario:  number;
  id_jogo:     number;
  data_jogada: string;
  nota?:       number | null;
  comentario?: string | null;
  created_at:  string;
  jogo:        Jogo;
};

export type DiscoverData = {
  reviews: Avaliacao[];
  lists:   Lista[];
  games:   Jogo[];
  users:   UsuarioCard[];
};

export type SearchResult = {
  games: Jogo[];
  users: UsuarioCard[];
  lists: Lista[];
};

export type TrendingData = {
  games:   Jogo[];
  reviews: Avaliacao[];
  lists:   Lista[];
  periodo: string;
};
