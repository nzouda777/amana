import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_group" AS ENUM('team', 'committee');
  CREATE TYPE "public"."enum_pages_blocks_recent_resources_types" AS ENUM('articles', 'guides', 'webinars');
  CREATE TYPE "public"."enum__pages_v_blocks_team_group" AS ENUM('team', 'committee');
  CREATE TYPE "public"."enum__pages_v_blocks_recent_resources_types" AS ENUM('articles', 'guides', 'webinars');
  CREATE TABLE "pages_blocks_method_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_method_steps_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_method" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_method_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" "enum_pages_blocks_team_group" DEFAULT 'team',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_team_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_recent_resources_types" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_recent_resources_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_recent_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_recent_resources_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_guide_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"guide_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_guide_cta_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_method_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_method_steps_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_method" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_method_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" "enum__pages_v_blocks_team_group" DEFAULT 'team',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_recent_resources_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pages_v_blocks_recent_resources_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_recent_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_recent_resources_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_guide_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"guide_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_guide_cta_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "site_settings_key_figures" ADD COLUMN "key" varchar;
  -- Lignes existantes : clé provisoire unique (format ADR 010), à renommer dans l'admin.
  UPDATE "site_settings_key_figures" SET "key" = 'chiffre-' || "_order" WHERE "key" IS NULL;
  ALTER TABLE "site_settings_key_figures" ALTER COLUMN "key" SET NOT NULL;
  ALTER TABLE "pages_blocks_method_steps" ADD CONSTRAINT "pages_blocks_method_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_method"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_method_steps_locales" ADD CONSTRAINT "pages_blocks_method_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_method_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_method" ADD CONSTRAINT "pages_blocks_method_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_method_locales" ADD CONSTRAINT "pages_blocks_method_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_method"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_locales" ADD CONSTRAINT "pages_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_recent_resources_types" ADD CONSTRAINT "pages_blocks_recent_resources_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_recent_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_recent_resources" ADD CONSTRAINT "pages_blocks_recent_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_recent_resources_locales" ADD CONSTRAINT "pages_blocks_recent_resources_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_recent_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_cta" ADD CONSTRAINT "pages_blocks_guide_cta_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_cta" ADD CONSTRAINT "pages_blocks_guide_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guide_cta_locales" ADD CONSTRAINT "pages_blocks_guide_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_guide_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_method_steps" ADD CONSTRAINT "_pages_v_blocks_method_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_method"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_method_steps_locales" ADD CONSTRAINT "_pages_v_blocks_method_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_method_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_method" ADD CONSTRAINT "_pages_v_blocks_method_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_method_locales" ADD CONSTRAINT "_pages_v_blocks_method_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_method"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_locales" ADD CONSTRAINT "_pages_v_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_recent_resources_types" ADD CONSTRAINT "_pages_v_blocks_recent_resources_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_recent_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_recent_resources" ADD CONSTRAINT "_pages_v_blocks_recent_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_recent_resources_locales" ADD CONSTRAINT "_pages_v_blocks_recent_resources_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_recent_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_guide_cta" ADD CONSTRAINT "_pages_v_blocks_guide_cta_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_guide_cta" ADD CONSTRAINT "_pages_v_blocks_guide_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_guide_cta_locales" ADD CONSTRAINT "_pages_v_blocks_guide_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_guide_cta"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_method_steps_order_idx" ON "pages_blocks_method_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_method_steps_parent_id_idx" ON "pages_blocks_method_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_method_steps_locales_locale_parent_id_unique" ON "pages_blocks_method_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_method_steps_locales_parent_id_idx" ON "pages_blocks_method_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_method_order_idx" ON "pages_blocks_method" USING btree ("_order");
  CREATE INDEX "pages_blocks_method_parent_id_idx" ON "pages_blocks_method" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_method_path_idx" ON "pages_blocks_method" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_method_locales_locale_parent_id_unique" ON "pages_blocks_method_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_method_locales_parent_id_idx" ON "pages_blocks_method_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_team_locales_locale_parent_id_unique" ON "pages_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_team_locales_parent_id_idx" ON "pages_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_recent_resources_types_order_idx" ON "pages_blocks_recent_resources_types" USING btree ("order");
  CREATE INDEX "pages_blocks_recent_resources_types_parent_idx" ON "pages_blocks_recent_resources_types" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_recent_resources_order_idx" ON "pages_blocks_recent_resources" USING btree ("_order");
  CREATE INDEX "pages_blocks_recent_resources_parent_id_idx" ON "pages_blocks_recent_resources" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_recent_resources_path_idx" ON "pages_blocks_recent_resources" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_recent_resources_locales_locale_parent_id_uniqu" ON "pages_blocks_recent_resources_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_recent_resources_locales_parent_id_idx" ON "pages_blocks_recent_resources_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guide_cta_order_idx" ON "pages_blocks_guide_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_guide_cta_parent_id_idx" ON "pages_blocks_guide_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guide_cta_path_idx" ON "pages_blocks_guide_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_guide_cta_guide_idx" ON "pages_blocks_guide_cta" USING btree ("guide_id");
  CREATE UNIQUE INDEX "pages_blocks_guide_cta_locales_locale_parent_id_unique" ON "pages_blocks_guide_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_guide_cta_locales_parent_id_idx" ON "pages_blocks_guide_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_method_steps_order_idx" ON "_pages_v_blocks_method_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_method_steps_parent_id_idx" ON "_pages_v_blocks_method_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_method_steps_locales_locale_parent_id_unique" ON "_pages_v_blocks_method_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_method_steps_locales_parent_id_idx" ON "_pages_v_blocks_method_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_method_order_idx" ON "_pages_v_blocks_method" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_method_parent_id_idx" ON "_pages_v_blocks_method" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_method_path_idx" ON "_pages_v_blocks_method" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_method_locales_locale_parent_id_unique" ON "_pages_v_blocks_method_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_method_locales_parent_id_idx" ON "_pages_v_blocks_method_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "_pages_v_blocks_team" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_team_locales_locale_parent_id_unique" ON "_pages_v_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_team_locales_parent_id_idx" ON "_pages_v_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_recent_resources_types_order_idx" ON "_pages_v_blocks_recent_resources_types" USING btree ("order");
  CREATE INDEX "_pages_v_blocks_recent_resources_types_parent_idx" ON "_pages_v_blocks_recent_resources_types" USING btree ("parent_id");
  CREATE INDEX "_pages_v_blocks_recent_resources_order_idx" ON "_pages_v_blocks_recent_resources" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_recent_resources_parent_id_idx" ON "_pages_v_blocks_recent_resources" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_recent_resources_path_idx" ON "_pages_v_blocks_recent_resources" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_recent_resources_locales_locale_parent_id_un" ON "_pages_v_blocks_recent_resources_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_recent_resources_locales_parent_id_idx" ON "_pages_v_blocks_recent_resources_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_guide_cta_order_idx" ON "_pages_v_blocks_guide_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_guide_cta_parent_id_idx" ON "_pages_v_blocks_guide_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_guide_cta_path_idx" ON "_pages_v_blocks_guide_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_guide_cta_guide_idx" ON "_pages_v_blocks_guide_cta" USING btree ("guide_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_guide_cta_locales_locale_parent_id_unique" ON "_pages_v_blocks_guide_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_guide_cta_locales_parent_id_idx" ON "_pages_v_blocks_guide_cta_locales" USING btree ("_parent_id");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_team_members_id_idx" ON "pages_rels" USING btree ("team_members_id");
  CREATE INDEX "_pages_v_rels_team_members_id_idx" ON "_pages_v_rels" USING btree ("team_members_id");
  CREATE INDEX "partners_display_authorized_idx" ON "partners" USING btree ("display_authorized");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_method_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_method_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_method" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_method_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_recent_resources_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_recent_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_recent_resources_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_guide_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_guide_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_method_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_method_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_method" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_method_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_recent_resources_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_recent_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_recent_resources_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_guide_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_guide_cta_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_method_steps" CASCADE;
  DROP TABLE "pages_blocks_method_steps_locales" CASCADE;
  DROP TABLE "pages_blocks_method" CASCADE;
  DROP TABLE "pages_blocks_method_locales" CASCADE;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "pages_blocks_team_locales" CASCADE;
  DROP TABLE "pages_blocks_recent_resources_types" CASCADE;
  DROP TABLE "pages_blocks_recent_resources" CASCADE;
  DROP TABLE "pages_blocks_recent_resources_locales" CASCADE;
  DROP TABLE "pages_blocks_guide_cta" CASCADE;
  DROP TABLE "pages_blocks_guide_cta_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_method_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_method_steps_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_method" CASCADE;
  DROP TABLE "_pages_v_blocks_method_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_team" CASCADE;
  DROP TABLE "_pages_v_blocks_team_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_recent_resources_types" CASCADE;
  DROP TABLE "_pages_v_blocks_recent_resources" CASCADE;
  DROP TABLE "_pages_v_blocks_recent_resources_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_guide_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_guide_cta_locales" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_team_members_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_team_members_fk";
  
  DROP INDEX "pages_rels_team_members_id_idx";
  DROP INDEX "_pages_v_rels_team_members_id_idx";
  DROP INDEX "partners_display_authorized_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "team_members_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "team_members_id";
  ALTER TABLE "site_settings_key_figures" DROP COLUMN "key";
  DROP TYPE "public"."enum_pages_blocks_team_group";
  DROP TYPE "public"."enum_pages_blocks_recent_resources_types";
  DROP TYPE "public"."enum__pages_v_blocks_team_group";
  DROP TYPE "public"."enum__pages_v_blocks_recent_resources_types";`)
}
