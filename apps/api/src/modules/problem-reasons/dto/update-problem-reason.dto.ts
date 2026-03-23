import { IsString, IsOptional, IsBoolean, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProblemReasonDto {
  @ApiPropertyOptional({ example: "WEATHER_DELAY" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Погодная задержка" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: "Задержка рейса связанная с погодными условиями",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "delay" })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: "high",
    enum: ["low", "medium", "high", "critical"],
  })
  @IsString()
  @IsIn(["low", "medium", "high", "critical"])
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
