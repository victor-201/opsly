import { IsString, IsIn, IsObject, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PROVIDER_TYPES } from '@opsly/shared';

export class CreateProviderConnectionDto {
  @ApiProperty({ enum: PROVIDER_TYPES })
  @IsIn(PROVIDER_TYPES)
  providerType: string;

  @ApiProperty({ example: 'My Render Account' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Provider-specific credentials' })
  @IsObject()
  credentials: Record<string, string>;
}
