import { PrismaClient } from '@prisma/client'; import fs from 'fs'; import path from 'path';
const prisma=new PrismaClient(); const dir=path.join(__dirname,'data'); const save=(n:string,d:any)=>{if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,n),JSON.stringify(d,null,2),'utf-8')};
async function main(){const users=await prisma.tAB_USUARIO.findMany(); const games=await prisma.tAB_JOGOS.findMany({include:{usuario:true}}); const reviews=await prisma.tAB_AVALIACAO.findMany({include:{usuario:true,jogo:true}}); const follows=await prisma.tAB_FOLLOW.findMany({include:{seguidor:true,seguido:true}}); const lists=await prisma.tAB_LISTA.findMany({include:{usuario:true,jogos:{include:{jogo:true}}}}); const status=await prisma.tAB_STATUS_JOGO.findMany({include:{usuario:true,jogo:true}});
save('users.json', users.map(u=>({nm_usuario:u.nm_usuario,email_usuario:u.email_usuario,senha_usuario:u.senha_usuario,tipo_usuario:u.tipo_usuario,bio_usuario:u.bio_usuario,img_usuario:u.img_usuario})));
save('games.json', games.map(g=>({admin:g.usuario?.nm_usuario||'admin',nm_jogo:g.nm_jogo,img_jogo:g.img_jogo,genero:g.genero,plataforma:g.plataforma,classificacao:g.classificacao,descricao:g.descricao,dt_jogo:g.dt_jogo.toISOString().slice(0,10)})));
save('reviews.json', reviews.map(r=>({usuario:r.usuario.nm_usuario,jogo:r.jogo.nm_jogo,nota:r.nota,comentario:r.comentario,data_jogada:r.data_jogada?.toISOString().slice(0,10)})));
save('follows.json', follows.map(f=>({seguidor:f.seguidor.nm_usuario,seguido:f.seguido.nm_usuario})));
save('lists.json', lists.map(l=>({usuario:l.usuario.nm_usuario,nm_lista:l.nm_lista,descricao:l.descricao,publica:l.publica,jogos:l.jogos.map(i=>i.jogo.nm_jogo)})));
save('status.json', status.map(s=>({usuario:s.usuario.nm_usuario,jogo:s.jogo.nm_jogo,status:s.status,favorito:s.favorito,top_position:s.top_position})));
console.log('Dados exportados com sucesso.');}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
