import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);

  constructor(private readonly config: ConfigService) {}

  async captureException(error: unknown, context?: Record<string, unknown>) {
    const enabled = this.config.get<boolean>(
      "observability.errorTrackingEnabled",
    );
    const webhookUrl = this.config.get<string>(
      "observability.errorTrackingWebhookUrl",
    );

    const payload = {
      timestamp: new Date().toISOString(),
      environment: this.config.get<string>("app.nodeEnv"),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    if (!enabled || !webhookUrl) {
      this.logger.error(payload.message, payload.stack);
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (webhookError) {
      this.logger.error(
        `Error tracking webhook failed: ${webhookError instanceof Error ? webhookError.message : String(webhookError)}`,
      );
    }
  }
}
