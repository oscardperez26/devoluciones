-- CreateEnum
CREATE TYPE "RolAdmin" AS ENUM ('AGENTE', 'SUPERVISOR', 'ADMIN');

-- CreateTable
CREATE TABLE "usuarios_admin" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolAdmin" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_admin_correo_key" ON "usuarios_admin"("correo");
