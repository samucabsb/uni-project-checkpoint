export type Usuario={id_usuario:number;nm_usuario:string;email_usuario:string;tipo_usuario:'USER'|'ADMIN';bio_usuario?:string;img_usuario?:string;isFollowing?:boolean;_count?:any;avaliacoes?:Avaliacao[];listas?:Lista[];status_jogos?:StatusJogo[]};
export type Jogo={id_jogo:number;nm_jogo:string;img_jogo:string;genero?:string;plataforma?:string;classificacao?:string;descricao?:string;dt_jogo:string;media?:number;total_avaliacoes?:number;avaliacoes?:Avaliacao[]};
export type Avaliacao={id_avaliacao:number;id_usuario:number;id_jogo:number;nota:number;comentario:string;data_jogada?:string;created_at:string;usuario?:Usuario;jogo?:Jogo;tipo?:string};
export type Lista={id_lista:number;id_usuario:number;nm_lista:string;descricao?:string;publica:boolean;usuario?:Usuario;jogos?:{jogo:Jogo}[]};
export type StatusJogo={id_status:number;status:string;favorito:boolean;top_position?:number;jogo:Jogo};
