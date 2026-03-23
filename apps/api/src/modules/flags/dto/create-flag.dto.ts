import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFlagDto {
  @ApiProperty({ example: "urgent" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Срочный" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "Срочная задача" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "#e74c3c" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "alert-circle" })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: "request" })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
