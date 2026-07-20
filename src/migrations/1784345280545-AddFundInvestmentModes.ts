import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFundInvestmentModes1784345280545 implements MigrationInterface {
    name = 'AddFundInvestmentModes1784345280545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funds" ADD "sip_allowed" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "funds" ADD "lump_sum_allowed" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funds" DROP COLUMN "lump_sum_allowed"`);
        await queryRunner.query(`ALTER TABLE "funds" DROP COLUMN "sip_allowed"`);
    }

}
