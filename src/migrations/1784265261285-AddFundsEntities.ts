import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFundsEntities1784265261285 implements MigrationInterface {
    name = 'AddFundsEntities1784265261285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."funds_fund_main_category_enum" AS ENUM('Equity', 'Debt', 'Hybrid', 'Solution Oriented', 'Other')`);
        await queryRunner.query(`CREATE TYPE "public"."funds_fund_sub_category_enum" AS ENUM('Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Multi Cap', 'ELSS', 'Sectoral/Thematic', 'Liquid', 'Ultra Short', 'Money Market', 'Arbitrage', 'Dynamic Asset Allocation', 'Index Funds', 'Other')`);
        await queryRunner.query(`CREATE TYPE "public"."funds_fund_risk_enum" AS ENUM('Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High')`);
        await queryRunner.query(`CREATE TABLE "funds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fund_house_id" uuid NOT NULL, "fund_name" character varying(255) NOT NULL, "fund_main_category" "public"."funds_fund_main_category_enum" NOT NULL DEFAULT 'Other', "fund_sub_category" "public"."funds_fund_sub_category_enum" NOT NULL DEFAULT 'Other', "scheme_code" character varying(50) NOT NULL, "fund_risk" "public"."funds_fund_risk_enum" NOT NULL DEFAULT 'Moderate', "fund_return_rate" numeric(5,2), "isin" character varying(50), "nav" numeric(15,4) NOT NULL DEFAULT '0', "expense_ratio" numeric(5,2), "assets_under_management" numeric(15,2), "minimum_investment" numeric(15,2), "launch_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d785f4bb8f680f3febd40718f68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23e89c81bb25757b2f0bd52e5b" ON "funds"  ("scheme_code") `);
        await queryRunner.query(`CREATE TABLE "fund_houses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fund_house_name" character varying(255) NOT NULL, "website" character varying(255), "logo_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bfb6bc4d182be8556d54cc866c4" UNIQUE ("fund_house_name"), CONSTRAINT "PK_d22a5e66a29fcb4fe3167c77599" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "funds" ADD CONSTRAINT "FK_cc114d21f8595ba0a7b52eba553" FOREIGN KEY ("fund_house_id") REFERENCES "fund_houses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funds" DROP CONSTRAINT "FK_cc114d21f8595ba0a7b52eba553"`);
        await queryRunner.query(`DROP TABLE "fund_houses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23e89c81bb25757b2f0bd52e5b"`);
        await queryRunner.query(`DROP TABLE "funds"`);
        await queryRunner.query(`DROP TYPE "public"."funds_fund_risk_enum"`);
        await queryRunner.query(`DROP TYPE "public"."funds_fund_sub_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."funds_fund_main_category_enum"`);
    }

}
