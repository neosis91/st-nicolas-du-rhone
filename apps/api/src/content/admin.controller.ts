import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentService } from './content.service';
import {
  ArticleDto,
  EventDto,
  MassDto,
  MinistryDto,
  PersonDto,
  PlaceDto,
  SacramentDto,
  SettingsDto,
  SheetMaterialQuery,
  SheetUploadDto,
} from './dto';
import { SheetUploadFilter } from './sheet-upload.filter';

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly content: ContentService) {}

  @Get('summary')
  summary() {
    return this.content.summary();
  }

  @Put('settings')
  updateSettings(@Body() dto: SettingsDto) {
    return this.content.updateSettings(dto);
  }

  @Get('articles')
  articles() {
    return this.content.adminArticles();
  }

  @Get('articles/:id')
  article(@Param('id') id: string) {
    return this.content.adminArticle(id);
  }

  @Post('articles')
  createArticle(@Body() dto: ArticleDto) {
    return this.content.createArticle(dto);
  }

  @Put('articles/:id')
  updateArticle(@Param('id') id: string, @Body() dto: ArticleDto) {
    return this.content.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  deleteArticle(@Param('id') id: string) {
    return this.content.deleteArticle(id);
  }

  @Get('events')
  events() {
    return this.content.adminEvents();
  }

  @Get('events/:id')
  event(@Param('id') id: string) {
    return this.content.adminEvent(id);
  }

  @Post('events')
  createEvent(@Body() dto: EventDto) {
    return this.content.createEvent(dto);
  }

  @Put('events/:id')
  updateEvent(@Param('id') id: string, @Body() dto: EventDto) {
    return this.content.updateEvent(id, dto);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.content.deleteEvent(id);
  }

  @Get('places')
  places() {
    return this.content.adminPlaces();
  }

  @Post('places')
  createPlace(@Body() dto: PlaceDto) {
    return this.content.createPlace(dto);
  }

  @Put('places/:id')
  updatePlace(@Param('id') id: string, @Body() dto: PlaceDto) {
    return this.content.updatePlace(id, dto);
  }

  @Delete('places/:id')
  deletePlace(@Param('id') id: string) {
    return this.content.deletePlace(id);
  }

  @Get('people')
  people() {
    return this.content.adminPeople();
  }

  @Post('people')
  createPerson(@Body() dto: PersonDto) {
    return this.content.createPerson(dto);
  }

  @Put('people/:id')
  updatePerson(@Param('id') id: string, @Body() dto: PersonDto) {
    return this.content.updatePerson(id, dto);
  }

  @Delete('people/:id')
  deletePerson(@Param('id') id: string) {
    return this.content.deletePerson(id);
  }

  @Get('masses')
  masses() {
    return this.content.adminMasses();
  }

  @Post('masses')
  createMass(@Body() dto: MassDto) {
    return this.content.createMass(dto);
  }

  @Put('masses/:id')
  updateMass(@Param('id') id: string, @Body() dto: MassDto) {
    return this.content.updateMass(id, dto);
  }

  @Delete('masses/:id')
  deleteMass(@Param('id') id: string) {
    return this.content.deleteMass(id);
  }

  @Get('sacraments')
  sacraments() {
    return this.content.adminSacraments();
  }

  @Get('sacraments/:id')
  sacrament(@Param('id') id: string) {
    return this.content.adminSacrament(id);
  }

  @Post('sacraments')
  createSacrament(@Body() dto: SacramentDto) {
    return this.content.createSacrament(dto);
  }

  @Put('sacraments/:id')
  updateSacrament(@Param('id') id: string, @Body() dto: SacramentDto) {
    return this.content.updateSacrament(id, dto);
  }

  @Delete('sacraments/:id')
  deleteSacrament(@Param('id') id: string) {
    return this.content.deleteSacrament(id);
  }

  @Get('ministries')
  ministries() {
    return this.content.adminMinistries();
  }

  @Get('ministries/:id')
  ministry(@Param('id') id: string) {
    return this.content.adminMinistry(id);
  }

  @Post('ministries')
  createMinistry(@Body() dto: MinistryDto) {
    return this.content.createMinistry(dto);
  }

  @Put('ministries/:id')
  updateMinistry(@Param('id') id: string, @Body() dto: MinistryDto) {
    return this.content.updateMinistry(id, dto);
  }

  @Delete('ministries/:id')
  deleteMinistry(@Param('id') id: string) {
    return this.content.deleteMinistry(id);
  }

  @Get('messages')
  messages() {
    return this.content.messages();
  }

  @Put('messages/:id/read')
  markRead(@Param('id') id: string) {
    return this.content.markMessageRead(id);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) {
    return this.content.deleteMessage(id);
  }

  @Get('sheets')
  sheets() {
    return this.content.adminSheets();
  }

  @Get('sheets/matiere')
  sheetMaterial(@Query() query: SheetMaterialQuery) {
    return this.content.sheetMaterial(query.kind, query.periodStart);
  }

  @Post('sheets')
  @UseFilters(SheetUploadFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  createSheet(@Body() dto: SheetUploadDto, @UploadedFile() file: Express.Multer.File) {
    return this.content.createSheet(dto, file);
  }

  @Get('sheets/:id/fichier')
  async sheetFile(@Param('id') id: string) {
    const file = await this.content.openSheet(id, false);
    return new StreamableFile(file.stream, {
      type: 'application/pdf',
      disposition: file.disposition,
    });
  }

  @Delete('sheets/:id')
  deleteSheet(@Param('id') id: string) {
    return this.content.deleteSheet(id);
  }
}
