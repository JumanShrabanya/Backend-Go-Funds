import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvestmentPlanTable1784346316793 implements MigrationInterface {
    name = 'CreateInvestmentPlanTable1784346316793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."investment_plans_risk_profile_enum" AS ENUM('conservative', 'moderate', 'aggressive')`);
        await queryRunner.query(`CREATE TYPE "public"."investment_plans_goal_type_enum" AS ENUM('wealth_creation', 'retirement', 'house_purchase', 'child_education', 'emergency_fund', 'tax_saving')`);
        await queryRunner.query(`CREATE TYPE "public"."investment_plans_horizon_enum" AS ENUM('less_than_3_years', '3_to_5_years', '5_to_10_years', 'more_than_10_years')`);
        await queryRunner.query(`CREATE TABLE "investment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "risk_profile" "public"."investment_plans_risk_profile_enum" NOT NULL, "goal_type" "public"."investment_plans_goal_type_enum" NOT NULL, "horizon" "public"."investment_plans_horizon_enum" NOT NULL, "monthly_amount" numeric(15,2) NOT NULL, "allocations" jsonb NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a8191913fe406c5b14dd8eb3ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "investment_plans" ADD CONSTRAINT "FK_a59857cd62e587d907c3c3a3b69" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "investment_plans" DROP CONSTRAINT "FK_a59857cd62e587d907c3c3a3b69"`);
        await queryRunner.query(`DROP TABLE "investment_plans"`);
        await queryRunner.query(`DROP TYPE "public"."investment_plans_horizon_enum"`);
        await queryRunner.query(`DROP TYPE "public"."investment_plans_goal_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."investment_plans_risk_profile_enum"`);
    }

}
