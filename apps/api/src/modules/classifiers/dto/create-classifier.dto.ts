import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateClassifierDto {
  @ApiProperty({ example: "delay_reason" })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: "weather" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Погодные условия" })
  @IsString()
  @IsNotEmpty()
  name: string;

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
