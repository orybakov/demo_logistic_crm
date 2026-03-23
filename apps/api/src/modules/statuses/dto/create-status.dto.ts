import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateStatusDto {
  @ApiProperty({ example: "request" })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ example: "new" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Новый" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "Новый заказ" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "#3498db" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "plus-circle" })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999)
  sortOrder?: number;
}
