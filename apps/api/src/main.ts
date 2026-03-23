import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { randomUUID } from "crypto";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { appLogger } from "./common/observability";
import { ErrorTrackingService } from "./common/observability";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: appLogger });
  const config = app.get(ConfigService);

  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers["x-request-id"] || randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
  });

  app.enableCors({
    origin: config.get<string[]>("app.corsOrigins") || [
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  });

  app.use(helmet());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "api/v",
  });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (config.get<boolean>("observability.enableSwagger")) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Logistics CRM API")
      .setDescription("Production API documentation")
      .setVersion("1.0.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
      useGlobalPrefix: true,
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>("app.port") || 3001;
  const errorTracking = app.get(ErrorTrackingService);

  process.on("unhandledRejection", (reason) => {
    void errorTracking.captureException(reason, {
      source: "unhandledRejection",
    });
  });
  process.on("uncaughtException", (error) => {
    void errorTracking.captureException(error, { source: "uncaughtException" });
  });

  await app.listen(port);

  appLogger.log(`Application started`, {
    context: "Bootstrap",
    path: `http://localhost:${port}/api/v1`,
  });
}

bootstrap().catch((err) => {
  appLogger.error(
    err instanceof Error ? err.message : String(err),
    err instanceof Error ? err.stack : undefined,
    {
      context: "Bootstrap",
    },
  );
  process.exit(1);
});
