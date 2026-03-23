import { Module } from "@nestjs/common";
import { FuelTypesController } from "./fuel-types.controller";
import { FuelTypesService } from "./fuel-types.service";

@Module({
  controllers: [FuelTypesController],
  providers: [FuelTypesService],
  exports: [FuelTypesService],
})
export class FuelTypesModule {}
