import { IsOptional, IsString, Length } from 'class-validator';

export class ReviewPortalRequestDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  memo?: string;
}
