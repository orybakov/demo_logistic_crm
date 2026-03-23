import { IsString, IsBoolean, IsOptional, IsEmail } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateFilialDto {
  @ApiPropertyOptional({ example: "MOSCOW" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "Московский филиал" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "Москва" })
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiPropertyOptional({ example: "г. Москва, ул. Примерная, д. 1" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: "+7 (495) 123-45-67" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "moscow@example.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isHead?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
