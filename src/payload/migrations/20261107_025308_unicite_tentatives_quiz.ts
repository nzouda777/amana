import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "user_quiz_idx";
  CREATE UNIQUE INDEX "user_quiz_attemptNumber_idx" ON "quiz_attempts" USING btree ("user_id","quiz_id","attempt_number");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "user_quiz_attemptNumber_idx";
  CREATE INDEX "user_quiz_idx" ON "quiz_attempts" USING btree ("user_id","quiz_id");`)
}
