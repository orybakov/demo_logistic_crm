import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { TripsService } from "./trips.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RoleCode } from "@prisma/client";
import {
  CreateTripDto,
  UpdateTripDto,
  AssignResourcesDto,
  CompleteTripDto,
  CancelTripDto,
  ChangeStatusDto,
  UpdateCheckpointDto,
  AddCheckpointDto,
  LinkRequestDto,
  AddCommentDto,
  TripQueryDto,
  ScheduleQueryDto,
  TripStatus,
} from "./dto";

@Controller("trips")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Get()
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
  )
  async findAll(@Query() query: TripQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get("stats")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
  )
  async getStats() {
    const [active, completedToday, scheduled] = await Promise.all([
      this.tripsService.findAll({ status: "in_progress", limit: 1 }),
      this.tripsService.findAll({ status: "completed", limit: 100 }),
      this.tripsService.findAll({ status: "scheduled", limit: 100 }),
    ]);

    return {
      active: active.total,
      completedToday: completedToday.total,
      scheduled: scheduled.total,
    };
  }

  @Get("schedule")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
  )
  async getSchedule(@Query() query: ScheduleQueryDto) {
    return this.tripsService.getSchedule(query);
  }

  @Get("available-resources")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async getAvailableResources(
    @Query("dateFrom") dateFrom: string,
    @Query("dateTo") dateTo: string,
    @Query("excludeTripId") excludeTripId?: string,
  ) {
    return this.tripsService.getAvailableResources(
      new Date(dateFrom),
      new Date(dateTo),
      excludeTripId,
    );
  }

  @Get(":id")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.tripsService.findOne(id);
  }

  @Get(":id/comments")
  @Roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.DRIVER,
  )
  async getComments(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.tripsService.getComments(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async create(@Body() data: CreateTripDto, @CurrentUser("id") userId: string) {
    return this.tripsService.create(data, userId);
  }

  @Put(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateTripDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.update(id, data, userId);
  }

  @Put(":id/assign")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async assignResources(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: AssignResourcesDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.assignResources(id, data, userId);
  }

  @Put(":id/status")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.DRIVER)
  async changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: ChangeStatusDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.changeStatus(
      id,
      data.status,
      userId,
      data.comment,
    );
  }

  @Put(":id/start")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async start(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.changeStatus(id, TripStatus.IN_PROGRESS, userId);
  }

  @Put(":id/complete")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: CompleteTripDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.complete(
      id,
      {
        ...data,
        actualEnd: data.actualEnd ? new Date(data.actualEnd) : undefined,
      },
      userId,
    );
  }

  @Put(":id/cancel")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: CancelTripDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.cancel(id, data.cancellationReason, userId);
  }

  @Put(":id/checkpoints/:checkpointId")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER, RoleCode.DRIVER)
  async updateCheckpoint(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("checkpointId", ParseUUIDPipe) checkpointId: string,
    @Body() data: UpdateCheckpointDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.updateCheckpoint(id, checkpointId, {
      ...data,
      actualTime: data.actualTime ? new Date(data.actualTime) : undefined,
      completedById: userId,
    });
  }

  @Post(":id/checkpoints")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async addCheckpoint(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: AddCheckpointDto,
  ) {
    return this.tripsService.addCheckpoint(id, data);
  }

  @Delete(":id/checkpoints/:checkpointId")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async removeCheckpoint(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("checkpointId", ParseUUIDPipe) checkpointId: string,
  ) {
    await this.tripsService.removeCheckpoint(id, checkpointId);
    return { success: true };
  }

  @Post(":id/link-request")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async linkRequest(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: LinkRequestDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.linkRequest(id, data.requestId, userId);
  }

  @Delete(":id/link-request")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.DISPATCHER)
  async unlinkRequest(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.unlinkRequest(id, userId);
  }

  @Post(":id/comments")
  async addComment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: AddCommentDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.tripsService.addComment(id, data.text, userId);
  }

  @Delete(":id")
  @Roles(RoleCode.ADMIN, RoleCode.MANAGER)
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    await this.tripsService.delete(id, userId);
    return { success: true };
  }
}
