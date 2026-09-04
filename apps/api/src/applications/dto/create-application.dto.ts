import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'my-app' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'My awesome application' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://github.com/org/my-app' })
  @IsString()
  @IsOptional()
  repositoryUrl?: string;

  @ApiPropertyOptional({ example: 'frontend' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  type?: string;
}
