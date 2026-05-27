-- CreateTable
CREATE TABLE "TAB_USUARIO" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nm_usuario" TEXT NOT NULL,
    "email_usuario" TEXT NOT NULL,
    "senha_usuario" TEXT NOT NULL,
    "tipo_usuario" TEXT NOT NULL DEFAULT 'USER',
    "bio_usuario" TEXT,
    "img_usuario" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TAB_JOGOS" (
    "id_jogo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER,
    "nm_jogo" TEXT NOT NULL,
    "img_jogo" TEXT NOT NULL,
    "genero" TEXT,
    "plataforma" TEXT,
    "classificacao" TEXT,
    "descricao" TEXT,
    "dt_jogo" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TAB_JOGOS_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "TAB_USUARIO" ("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TAB_AVALIACAO" (
    "id_avaliacao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER NOT NULL,
    "id_jogo" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "data_jogada" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TAB_AVALIACAO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "TAB_USUARIO" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TAB_AVALIACAO_id_jogo_fkey" FOREIGN KEY ("id_jogo") REFERENCES "TAB_JOGOS" ("id_jogo") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TAB_LISTA" (
    "id_lista" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER NOT NULL,
    "nm_lista" TEXT NOT NULL,
    "descricao" TEXT,
    "publica" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TAB_LISTA_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "TAB_USUARIO" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TAB_LISTA_JOGO" (
    "id_lista" INTEGER NOT NULL,
    "id_jogo" INTEGER NOT NULL,

    PRIMARY KEY ("id_lista", "id_jogo"),
    CONSTRAINT "TAB_LISTA_JOGO_id_lista_fkey" FOREIGN KEY ("id_lista") REFERENCES "TAB_LISTA" ("id_lista") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TAB_LISTA_JOGO_id_jogo_fkey" FOREIGN KEY ("id_jogo") REFERENCES "TAB_JOGOS" ("id_jogo") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TAB_FOLLOW" (
    "id_follow" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario_seguidor" INTEGER NOT NULL,
    "id_usuario_seguido" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TAB_FOLLOW_id_usuario_seguidor_fkey" FOREIGN KEY ("id_usuario_seguidor") REFERENCES "TAB_USUARIO" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TAB_FOLLOW_id_usuario_seguido_fkey" FOREIGN KEY ("id_usuario_seguido") REFERENCES "TAB_USUARIO" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TAB_STATUS_JOGO" (
    "id_status" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER NOT NULL,
    "id_jogo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUERO_JOGAR',
    "favorito" BOOLEAN NOT NULL DEFAULT false,
    "top_position" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TAB_STATUS_JOGO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "TAB_USUARIO" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TAB_STATUS_JOGO_id_jogo_fkey" FOREIGN KEY ("id_jogo") REFERENCES "TAB_JOGOS" ("id_jogo") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TAB_USUARIO_nm_usuario_key" ON "TAB_USUARIO"("nm_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "TAB_USUARIO_email_usuario_key" ON "TAB_USUARIO"("email_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "TAB_JOGOS_nm_jogo_key" ON "TAB_JOGOS"("nm_jogo");

-- CreateIndex
CREATE INDEX "TAB_JOGOS_nm_jogo_idx" ON "TAB_JOGOS"("nm_jogo");

-- CreateIndex
CREATE INDEX "TAB_JOGOS_genero_idx" ON "TAB_JOGOS"("genero");

-- CreateIndex
CREATE INDEX "TAB_AVALIACAO_id_usuario_idx" ON "TAB_AVALIACAO"("id_usuario");

-- CreateIndex
CREATE INDEX "TAB_AVALIACAO_id_jogo_idx" ON "TAB_AVALIACAO"("id_jogo");

-- CreateIndex
CREATE INDEX "TAB_AVALIACAO_created_at_idx" ON "TAB_AVALIACAO"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "TAB_AVALIACAO_id_usuario_id_jogo_key" ON "TAB_AVALIACAO"("id_usuario", "id_jogo");

-- CreateIndex
CREATE INDEX "TAB_LISTA_id_usuario_idx" ON "TAB_LISTA"("id_usuario");

-- CreateIndex
CREATE INDEX "TAB_LISTA_created_at_idx" ON "TAB_LISTA"("created_at");

-- CreateIndex
CREATE INDEX "TAB_FOLLOW_id_usuario_seguidor_idx" ON "TAB_FOLLOW"("id_usuario_seguidor");

-- CreateIndex
CREATE INDEX "TAB_FOLLOW_id_usuario_seguido_idx" ON "TAB_FOLLOW"("id_usuario_seguido");

-- CreateIndex
CREATE UNIQUE INDEX "TAB_FOLLOW_id_usuario_seguidor_id_usuario_seguido_key" ON "TAB_FOLLOW"("id_usuario_seguidor", "id_usuario_seguido");

-- CreateIndex
CREATE INDEX "TAB_STATUS_JOGO_id_usuario_idx" ON "TAB_STATUS_JOGO"("id_usuario");

-- CreateIndex
CREATE INDEX "TAB_STATUS_JOGO_id_jogo_idx" ON "TAB_STATUS_JOGO"("id_jogo");

-- CreateIndex
CREATE INDEX "TAB_STATUS_JOGO_status_idx" ON "TAB_STATUS_JOGO"("status");

-- CreateIndex
CREATE INDEX "TAB_STATUS_JOGO_favorito_idx" ON "TAB_STATUS_JOGO"("favorito");

-- CreateIndex
CREATE UNIQUE INDEX "TAB_STATUS_JOGO_id_usuario_id_jogo_key" ON "TAB_STATUS_JOGO"("id_usuario", "id_jogo");
