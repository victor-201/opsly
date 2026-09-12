import { IsString, IsIn, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PROVIDER_TYPES } from '@opsly/shared';

export class PreviewOrganizationsDto {
  @ApiProperty({ enum: PROVIDER_TYPES })
  @IsIn(PROVIDER_TYPES)
  providerType: string;

  @ApiProperty({ description: 'Provider-specific credentials' })
  @IsObject()
  credentials: Record<string, string>;
}