import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { SeederService } from "./seeder.service";
import { AuditService } from "./audit.service";

@Global()
@Module({
  providers: [PrismaService, SeederService, AuditService],
  exports: [PrismaService, AuditService],
})
export class DatabaseModule {}
