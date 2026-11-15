import { IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class MfaDto {
  @IsString()
  @MinLength(20)
  ticket!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}

export class MfaCodeDto {
  @IsString()
  @MinLength(6)
  code!: string;
}

export class DisableMfaDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}

export class PasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  nextPassword!: string;
}

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  password!: string;
}

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @ValidateIf((dto: UpdateUserDto) => typeof dto.password === 'string' && dto.password.length > 0)
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  password?: string;
}
