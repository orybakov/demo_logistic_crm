import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVehicleTypeDto {
  @ApiProperty({ example: "truck_20t" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Грузовик 20т" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: "Грузовой автомобиль грузоподъемностью до 20 тонн",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "general" })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 20000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  capacityKg?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  capacityM3?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasTrailer?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
