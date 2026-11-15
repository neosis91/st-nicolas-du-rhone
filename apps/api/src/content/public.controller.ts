import { Body, Controller, Get, Param, Post, Req, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ContentService } from './content.service';
import { MessageDto } from './dto';

@Controller('api')
export class PublicController {
  constructor(private readonly content: ContentService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('settings')
  settings() {
    return this.content.settings();
  }

  @Get('articles')
  articles() {
    return this.content.listArticles();
  }

  @Get('articles/:slug')
  article(@Param('slug') slug: string) {
    return this.content.article(slug);
  }

  @Get('events')
  events() {
    return this.content.listEvents();
  }

  @Get('places')
  places() {
    return this.content.listPlaces();
  }

  @Get('masses')
  masses() {
    return this.content.masses();
  }

  @Get('people')
  people() {
    return this.content.people();
  }

  @Get('sacraments')
  sacraments() {
    return this.content.sacraments();
  }

  @Get('ministries')
  ministries() {
    return this.content.ministries();
  }

  @Get('sheets')
  sheets() {
    return this.content.listSheets();
  }

  @Get('sheets/:id/fichier')
  async sheetFile(@Param('id') id: string) {
    const file = await this.content.openSheet(id, true);
    return new StreamableFile(file.stream, {
      type: 'application/pdf',
      disposition: file.disposition,
    });
  }

  @Post('messages')
  message(@Body() dto: MessageDto, @Req() request: { ip?: string }) {
    return this.content.createMessage(dto, request.ip ?? 'local');
  }

  @Get('sitemap.xml')
  async sitemap(@Res() response: Response) {
    const xml = await this.content.sitemap();
    response.type('application/xml').send(xml);
  }
}
