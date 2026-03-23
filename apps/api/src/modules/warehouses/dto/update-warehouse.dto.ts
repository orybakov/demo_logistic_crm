import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ example: "WH-001" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Основной склад" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "ул. Пушкина, д. 10" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: "Москва" })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: "Московская обл." })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: "123456" })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 55.7558 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 37.6173 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: "Иван Иванов" })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ example: "+79001234567" })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentLoad?: number;

  @ApiPropertyOptional({ example: "Пн-Пт: 9:00-18:00" })
  @IsString()
  @IsOptional()
  workingHours?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  filialId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
