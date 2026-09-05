import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boards_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boards_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_boards_ownerId" ON "boards" ("ownerId")`);

    await queryRunner.query(`CREATE TYPE "board_members_role_enum" AS ENUM ('OWNER', 'EDITOR', 'VIEWER')`);
    await queryRunner.query(`
      CREATE TABLE "board_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "boardId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "board_members_role_enum" NOT NULL DEFAULT 'VIEWER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_board_members_board_user" UNIQUE ("boardId", "userId"),
        CONSTRAINT "FK_board_members_board" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_board_members_boardId" ON "board_members" ("boardId")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_members_userId" ON "board_members" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "columns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "boardId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "position" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_columns_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_columns_board" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_columns_position" CHECK ("position" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_columns_boardId" ON "columns" ("boardId")`);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "boardId" uuid NOT NULL,
        "columnId" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "position" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_board" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_column" FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_tasks_position" CHECK ("position" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_boardId" ON "tasks" ("boardId")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_columnId" ON "tasks" ("columnId")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_columnId_position" ON "tasks" ("columnId", "position")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "columns"`);
    await queryRunner.query(`DROP TABLE "board_members"`);
    await queryRunner.query(`DROP TYPE "board_members_role_enum"`);
    await queryRunner.query(`DROP TABLE "boards"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
