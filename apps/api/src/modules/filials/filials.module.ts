import { Module } from "@nestjs/common";
import { FilialsController } from "./filials.controller";
import { FilialsService } from "./filials.service";

@Module({
  controllers: [FilialsController],
  providers: [FilialsService],
  exports: [FilialsService],
})
export class FilialsModule {}
