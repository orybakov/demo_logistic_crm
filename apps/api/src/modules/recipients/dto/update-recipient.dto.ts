import { IsString, IsOptional, IsEmail, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateRecipientDto {
  @ApiPropertyOptional({ example: "REC-001" })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: "ООО Получатель" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "7701234567" })
  @IsString()
  @IsOptional()
  inn?: string;

  @ApiPropertyOptional({ example: "770101001" })
  @IsString()
  @IsOptional()
  kpp?: string;

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

  @ApiPropertyOptional({ example: "Иван Иванов" })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ example: "+79001234567" })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: "contact@example.com" })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: "Дополнительные заметки" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  filialId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
