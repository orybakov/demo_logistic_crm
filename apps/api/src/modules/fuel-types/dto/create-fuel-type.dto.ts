import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFuelTypeDto {
  @ApiProperty({ example: "diesel" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Дизельное топливо" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: "Дизельное топливо для грузовых автомобилей",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
