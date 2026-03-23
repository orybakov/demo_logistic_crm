import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  appConfig,
  databaseConfig,
  observabilityConfig,
  jwtConfig,
  redisConfig,
} from "./configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        observabilityConfig,
      ],
    }),
  ],
})
export class AppConfigModule {}
