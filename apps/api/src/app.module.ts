import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/app-config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";
import { DriversModule } from "./modules/drivers/drivers.module";
import { RequestsModule } from "./modules/requests/requests.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { TripsModule } from "./modules/trips/trips.module";
import { HealthModule } from "./modules/health/health.module";
import { FilialsModule } from "./modules/filials/filials.module";
import { WarehousesModule } from "./modules/warehouses/warehouses.module";
import { RecipientsModule } from "./modules/recipients/recipients.module";
import { VehicleTypesModule } from "./modules/vehicle-types/vehicle-types.module";
import { FuelTypesModule } from "./modules/fuel-types/fuel-types.module";
import { StatusesModule } from "./modules/statuses/statuses.module";
import { FlagsModule } from "./modules/flags/flags.module";
import { ClassifiersModule } from "./modules/classifiers/classifiers.module";
import { ProblemReasonsModule } from "./modules/problem-reasons/problem-reasons.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AdminModule } from "./modules/admin/admin.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { ObservabilityModule } from "./common/observability";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    VehiclesModule,
    DriversModule,
    RequestsModule,
    OrdersModule,
    TripsModule,
    HealthModule,
    FilialsModule,
    WarehousesModule,
    RecipientsModule,
    VehicleTypesModule,
    FuelTypesModule,
    StatusesModule,
    FlagsModule,
    ClassifiersModule,
    ProblemReasonsModule,
    DashboardModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
    DocumentsModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
