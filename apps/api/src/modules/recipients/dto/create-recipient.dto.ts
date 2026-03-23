import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRecipientDto {
  @ApiProperty({ example: "REC-001" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "ООО Получатель" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "7701234567" })
  @IsString()
  @IsOptional()
  inn?: string;

  @ApiPropertyOptional({ example: "770101001" })
  @IsString()
  @IsOptional()
  kpp?: string;

  @ApiProperty({ example: "ул. Пушкина, д. 10" })
  @IsString()
  @IsNotEmpty()
  address: string;

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

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
