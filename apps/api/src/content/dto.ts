import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ArticleDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(400)
  excerpt!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  sourceUrl?: string | null;

  @IsBoolean()
  published!: boolean;

  @IsISO8601()
  publishedAt!: string;
}

export class EventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  detail!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(240)
  location!: string;

  @IsIn(['Liturgie', 'Accueil', 'Paroisse'])
  kind!: string;

  @IsISO8601()
  startsAt!: string;

  @IsBoolean()
  published!: boolean;
}

export class PlaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  town!: string;

  @IsIn(['fleuve', 'coteaux'])
  kind!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  church?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  address?: string | null;

  @IsString()
  @MinLength(3)
  @MaxLength(600)
  note!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class PersonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  role!: string;

  @IsString()
  @MaxLength(600)
  detail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string | null;

  @IsIn(['ministre', 'curie'])
  groupName!: string;

  @IsBoolean()
  showOnContact!: boolean;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class MassDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  dayLabel!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  time!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(240)
  location!: string;

  @IsString()
  @MaxLength(400)
  note!: string;

  @IsIn(['sunday', 'weekday'])
  period!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class SacramentDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  text!: string;

  @IsArray()
  @IsString({ each: true })
  steps!: string[];

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class MinistryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(8000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  linkLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  linkUrl?: string | null;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class MessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  contact!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  subject!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;
}

export class SettingsDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(120)
  shortName!: string;

  @IsString()
  @MaxLength(120)
  domain!: string;

  @IsString()
  @MaxLength(200)
  siteUrl!: string;

  @IsString()
  @MaxLength(120)
  diocese!: string;

  @IsString()
  @MaxLength(300)
  dioceseUrl!: string;

  @IsString()
  @MaxLength(300)
  parishOnDioceseUrl!: string;

  @IsString()
  @MaxLength(300)
  donationsUrl!: string;

  @IsString()
  @MaxLength(300)
  bequestsUrl!: string;

  @IsString()
  @MaxLength(300)
  readingsUrl!: string;

  @IsString()
  @MaxLength(160)
  sector!: string;

  @IsString()
  @MaxLength(120)
  bishop!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MaxLength(160)
  street!: string;

  @IsString()
  @MaxLength(12)
  postalCode!: string;

  @IsString()
  @MaxLength(120)
  city!: string;

  @IsString()
  @MaxLength(160)
  hours!: string;

  @IsString()
  @MaxLength(400)
  mapUrl!: string;

  @IsString()
  @MaxLength(160)
  presbyteryStreet!: string;

  @IsString()
  @MaxLength(600)
  heroLede!: string;

  @IsString()
  @MaxLength(8000)
  aboutText!: string;

  @IsString()
  @MaxLength(2000)
  teamIntro!: string;

  @IsString()
  @MaxLength(4000)
  teamCouncils!: string;

  @IsString()
  @MaxLength(2000)
  massIntro!: string;

  @IsString()
  @MaxLength(2000)
  sacramentIntro!: string;

  @IsString()
  @MaxLength(2000)
  lifeIntro!: string;

  @IsString()
  @MaxLength(2000)
  donateIntro!: string;

  @IsString()
  @MaxLength(600)
  welcomeDetail!: string;

  @IsString()
  @MaxLength(160)
  publicationDirector!: string;

  @IsString()
  @MaxLength(2000)
  hostNote!: string;

  @IsEmail()
  denierEmail!: string;
}

export class SheetUploadDto {
  @IsIn(['week', 'month'])
  kind!: 'week' | 'month';

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodStart!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  published!: boolean;
}

export class SheetMaterialQuery {
  @IsIn(['week', 'month'])
  kind!: 'week' | 'month';

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodStart!: string;
}
