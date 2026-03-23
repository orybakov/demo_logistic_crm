import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateClassifierDto {
  @ApiPropertyOptional({ example: "delay_reason" })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: "weather" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Погодные условия" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "Задержка связанная с погодными условиями" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "weather_delay" })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({ example: "uuid-of-parent" })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
