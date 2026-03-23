import { Module } from "@nestjs/common";
import { ProblemReasonsController } from "./problem-reasons.controller";
import { ProblemReasonsService } from "./problem-reasons.service";

@Module({
  controllers: [ProblemReasonsController],
  providers: [ProblemReasonsService],
  exports: [ProblemReasonsService],
})
export class ProblemReasonsModule {}
