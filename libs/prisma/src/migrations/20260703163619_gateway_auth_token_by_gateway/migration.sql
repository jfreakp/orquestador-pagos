/*
  Warnings:

  - You are about to drop the column `gateway_config_id` on the `gateway_auth_tokens` table. All the data in the column will be lost.
  - Added the required column `gateway_id` to the `gateway_auth_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "gateway_auth_tokens" DROP CONSTRAINT "gateway_auth_tokens_gateway_config_id_fkey";

-- AlterTable
ALTER TABLE "gateway_auth_tokens" DROP COLUMN "gateway_config_id",
ADD COLUMN     "gateway_id" INTEGER NOT NULL,
ADD COLUMN     "refresh_token" BYTEA;

-- AddForeignKey
ALTER TABLE "gateway_auth_tokens" ADD CONSTRAINT "gateway_auth_tokens_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
