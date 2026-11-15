import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertSafeUrl,
  emptyToNull,
  phoneHref,
  slugify,
  splitParagraphs,
} from '../common/text';
import {
  ArticleDto,
  EventDto,
  MassDto,
  MessageDto,
  MinistryDto,
  PersonDto,
  PlaceDto,
  SacramentDto,
  SettingsDto,
  SheetUploadDto,
} from './dto';
import { composeSheetMaterial, SheetKind, sheetPeriod } from './sheet-material';
import {
  assertPdf,
  contentDisposition,
  downloadName,
  openSheetFile,
  removeSheetFile,
  storeSheet,
} from './sheet-storage';

const URL_FIELDS = [
  'siteUrl',
  'dioceseUrl',
  'parishOnDioceseUrl',
  'donationsUrl',
  'bequestsUrl',
  'readingsUrl',
  'mapUrl',
] as const;

@Injectable()
export class ContentService {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  async settings() {
    const settings = await this.prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) throw new NotFoundException('Les réglages du site ne sont pas encore créés.');
    return { ...settings, phoneHref: phoneHref(settings.phone) };
  }

  async updateSettings(dto: SettingsDto) {
    for (const field of URL_FIELDS) assertSafeUrl(dto[field], field);
    const data = { ...dto, email: dto.email.trim().toLowerCase(), denierEmail: dto.denierEmail.trim().toLowerCase() };
    return this.prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  }

  listArticles() {
    return this.prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        publishedAt: true,
      },
    });
  }

  async article(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, published: true },
    });
    if (!article) throw new NotFoundException('Actualité introuvable.');
    return this.toPublicArticle(article);
  }

  listEvents() {
    return this.prisma.event.findMany({
      where: { published: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  listPlaces() {
    return this.prisma.place.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async masses() {
    const rows = await this.prisma.massTime.findMany({ orderBy: { sortOrder: 'asc' } });
    return {
      sunday: rows.filter((row) => row.period === 'sunday'),
      weekday: rows.filter((row) => row.period === 'weekday'),
    };
  }

  async people() {
    const rows = await this.prisma.person.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map((person) => ({ ...person, phoneHref: phoneHref(person.phone) }));
  }

  async sacraments() {
    const rows = await this.prisma.sacrament.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      text: row.text,
      steps: this.steps(row.steps),
    }));
  }

  async ministries() {
    const rows = await this.prisma.ministry.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      paragraphs: splitParagraphs(row.body),
      linkLabel: row.linkLabel,
      linkUrl: row.linkUrl,
    }));
  }

  async createMessage(dto: MessageDto, ip: string) {
    if (dto.company?.trim()) return { ok: true };
    if (this.limited(ip)) {
      throw new HttpException('Trop de messages ont été envoyés. Réessayez plus tard.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.prisma.message.create({
      data: {
        name: dto.name.trim(),
        contact: dto.contact.trim(),
        subject: dto.subject.trim(),
        body: dto.body.trim(),
      },
    });
    return { ok: true };
  }

  async sitemap() {
    const settings = await this.settings();
    const articles = await this.prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    const base = settings.siteUrl.replace(/\/$/, '');
    const paths = [
      '/',
      '/paroisse',
      '/paroisse/equipe',
      '/celebrer',
      '/celebrer/sacrements',
      '/vivre',
      '/agenda',
      '/actualites',
      '/contact',
      '/don',
      '/feuilles',
      '/mentions-legales',
      ...articles.map((article) => `/actualites/${article.slug}`),
    ];
    const urls = paths
      .map((path) => `  <url><loc>${base}${path}</loc></url>`)
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  }

  summary() {
    return Promise.all([
      this.prisma.article.count(),
      this.prisma.event.count(),
      this.prisma.message.count({ where: { read: false } }),
      this.prisma.sheet.count(),
      this.prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]).then(([articles, events, unreadMessages, sheets, latestMessages]) => ({
      articles,
      events,
      unreadMessages,
      sheets,
      latestMessages,
    }));
  }

  adminSheets() {
    return this.prisma.sheet
      .findMany({ orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }] })
      .then((sheets) => sheets.map((sheet) => this.presentSheet(sheet, true)));
  }

  listSheets() {
    return this.prisma.sheet
      .findMany({
        where: { published: true },
        orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
      })
      .then((sheets) => sheets.map((sheet) => this.presentSheet(sheet, false)));
  }

  async sheetMaterial(kind: SheetKind, periodStart: string) {
    const period = this.parsePeriod(kind, periodStart);
    const [masses, ministries, events, articles] = await Promise.all([
      this.prisma.massTime.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.ministry.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.event.findMany({
        where: { published: true, startsAt: { gte: period.start, lt: period.end } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.article.findMany({
        where: { published: true, publishedAt: { gte: period.start, lt: period.end } },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);
    return composeSheetMaterial(kind, period, {
      masses: masses.map((mass) => ({
        dayLabel: mass.dayLabel,
        time: mass.time,
        location: mass.location,
        note: mass.note,
        period: mass.period,
      })),
      ministries: ministries.map((ministry) => ({ title: ministry.title, body: ministry.body })),
      events: events.map((event) => ({
        title: event.title,
        detail: event.detail,
        location: event.location,
        kind: event.kind,
        startsAt: event.startsAt,
      })),
      articles: articles.map((article) => ({
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        publishedAt: article.publishedAt,
      })),
    });
  }

  async createSheet(dto: SheetUploadDto, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Choisissez un fichier PDF.');
    try {
      assertPdf(file);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Fichier invalide.');
    }
    const period = this.parsePeriod(dto.kind, dto.periodStart);
    const storedName = await storeSheet(file.buffer);
    try {
      const sheet = await this.prisma.sheet.create({
        data: {
          kind: dto.kind,
          title: dto.title.trim(),
          periodStart: period.start,
          storedName,
          originalName: downloadName(file.originalname),
          mimeType: 'application/pdf',
          size: file.buffer.length,
          published: dto.published,
          source: 'upload',
        },
      });
      return this.presentSheet(sheet, true);
    } catch (error) {
      await removeSheetFile(storedName);
      throw error;
    }
  }

  async deleteSheet(id: string) {
    const sheet = await this.prisma.sheet.findUnique({ where: { id } });
    if (!sheet) throw new NotFoundException('Feuille introuvable.');
    await this.prisma.sheet.delete({ where: { id } });
    await removeSheetFile(sheet.storedName);
    return { ok: true };
  }

  async openSheet(id: string, publishedOnly: boolean) {
    const sheet = await this.prisma.sheet.findUnique({ where: { id } });
    if (!sheet || (publishedOnly && !sheet.published)) {
      throw new NotFoundException('Feuille introuvable.');
    }
    const stream = openSheetFile(sheet.storedName);
    if (!stream) throw new NotFoundException('Fichier introuvable.');
    return { stream, disposition: contentDisposition(sheet.originalName) };
  }

  adminArticles() {
    return this.prisma.article.findMany({ orderBy: { publishedAt: 'desc' } });
  }

  async adminArticle(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Actualité introuvable.');
    return article;
  }

  createArticle(dto: ArticleDto) {
    return this.write(() =>
      this.prisma.article.create({
        data: {
          slug: slugify(dto.slug?.trim() || dto.title),
          title: dto.title.trim(),
          excerpt: dto.excerpt.trim(),
          category: dto.category.trim(),
          body: dto.body.trim(),
          sourceLabel: emptyToNull(dto.sourceLabel),
          sourceUrl: this.optionalUrl(dto.sourceUrl, 'Lien source'),
          published: dto.published,
          publishedAt: new Date(dto.publishedAt),
        },
      }),
    );
  }

  updateArticle(id: string, dto: ArticleDto) {
    return this.write(() =>
      this.prisma.article.update({
        where: { id },
        data: {
          slug: slugify(dto.slug?.trim() || dto.title),
          title: dto.title.trim(),
          excerpt: dto.excerpt.trim(),
          category: dto.category.trim(),
          body: dto.body.trim(),
          sourceLabel: emptyToNull(dto.sourceLabel),
          sourceUrl: this.optionalUrl(dto.sourceUrl, 'Lien source'),
          published: dto.published,
          publishedAt: new Date(dto.publishedAt),
        },
      }),
    );
  }

  deleteArticle(id: string) {
    return this.remove(() => this.prisma.article.delete({ where: { id } }));
  }

  adminEvents() {
    return this.prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
  }

  async adminEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Date introuvable.');
    return event;
  }

  createEvent(dto: EventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title.trim(),
        detail: dto.detail.trim(),
        location: dto.location.trim(),
        kind: dto.kind,
        startsAt: new Date(dto.startsAt),
        published: dto.published,
      },
    });
  }

  updateEvent(id: string, dto: EventDto) {
    return this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title.trim(),
        detail: dto.detail.trim(),
        location: dto.location.trim(),
        kind: dto.kind,
        startsAt: new Date(dto.startsAt),
        published: dto.published,
      },
    });
  }

  deleteEvent(id: string) {
    return this.remove(() => this.prisma.event.delete({ where: { id } }));
  }

  adminPlaces() {
    return this.listPlaces();
  }

  createPlace(dto: PlaceDto) {
    return this.prisma.place.create({ data: this.placeData(dto) });
  }

  updatePlace(id: string, dto: PlaceDto) {
    return this.prisma.place.update({ where: { id }, data: this.placeData(dto) });
  }

  deletePlace(id: string) {
    return this.remove(() => this.prisma.place.delete({ where: { id } }));
  }

  adminPeople() {
    return this.people();
  }

  createPerson(dto: PersonDto) {
    return this.prisma.person.create({ data: this.personData(dto) });
  }

  updatePerson(id: string, dto: PersonDto) {
    return this.prisma.person.update({ where: { id }, data: this.personData(dto) });
  }

  deletePerson(id: string) {
    return this.remove(() => this.prisma.person.delete({ where: { id } }));
  }

  adminMasses() {
    return this.prisma.massTime.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createMass(dto: MassDto) {
    return this.prisma.massTime.create({ data: this.massData(dto) });
  }

  updateMass(id: string, dto: MassDto) {
    return this.prisma.massTime.update({ where: { id }, data: this.massData(dto) });
  }

  deleteMass(id: string) {
    return this.remove(() => this.prisma.massTime.delete({ where: { id } }));
  }

  adminSacraments() {
    return this.prisma.sacrament.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async adminSacrament(id: string) {
    const row = await this.prisma.sacrament.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Sacrement introuvable.');
    return { ...row, steps: this.steps(row.steps) };
  }

  createSacrament(dto: SacramentDto) {
    return this.write(() =>
      this.prisma.sacrament.create({
        data: {
          slug: slugify(dto.slug?.trim() || dto.title),
          title: dto.title.trim(),
          text: dto.text.trim(),
          steps: dto.steps.map((step) => step.trim()).filter(Boolean),
          sortOrder: dto.sortOrder,
        },
      }),
    );
  }

  updateSacrament(id: string, dto: SacramentDto) {
    return this.write(() =>
      this.prisma.sacrament.update({
        where: { id },
        data: {
          slug: slugify(dto.slug?.trim() || dto.title),
          title: dto.title.trim(),
          text: dto.text.trim(),
          steps: dto.steps.map((step) => step.trim()).filter(Boolean),
          sortOrder: dto.sortOrder,
        },
      }),
    );
  }

  deleteSacrament(id: string) {
    return this.remove(() => this.prisma.sacrament.delete({ where: { id } }));
  }

  adminMinistries() {
    return this.prisma.ministry.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async adminMinistry(id: string) {
    const row = await this.prisma.ministry.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Service introuvable.');
    return row;
  }

  createMinistry(dto: MinistryDto) {
    return this.write(() => this.prisma.ministry.create({ data: this.ministryData(dto) }));
  }

  updateMinistry(id: string, dto: MinistryDto) {
    return this.write(() =>
      this.prisma.ministry.update({ where: { id }, data: this.ministryData(dto) }),
    );
  }

  deleteMinistry(id: string) {
    return this.remove(() => this.prisma.ministry.delete({ where: { id } }));
  }

  messages() {
    return this.prisma.message.findMany({ orderBy: { createdAt: 'desc' } });
  }

  markMessageRead(id: string) {
    return this.prisma.message.update({ where: { id }, data: { read: true } });
  }

  deleteMessage(id: string) {
    return this.remove(() => this.prisma.message.delete({ where: { id } }));
  }

  private toPublicArticle(article: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    body: string;
    sourceLabel: string | null;
    sourceUrl: string | null;
    publishedAt: Date;
  }) {
    return {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      publishedAt: article.publishedAt,
      paragraphs: splitParagraphs(article.body),
      sourceLabel: article.sourceLabel,
      sourceUrl: article.sourceUrl,
    };
  }

  private placeData(dto: PlaceDto) {
    return {
      town: dto.town.trim(),
      kind: dto.kind,
      church: emptyToNull(dto.church),
      address: emptyToNull(dto.address),
      note: dto.note.trim(),
      sortOrder: dto.sortOrder,
    };
  }

  private personData(dto: PersonDto) {
    return {
      name: dto.name.trim(),
      role: dto.role.trim(),
      detail: dto.detail.trim(),
      phone: emptyToNull(dto.phone),
      email: emptyToNull(dto.email)?.toLowerCase() ?? null,
      groupName: dto.groupName,
      showOnContact: dto.showOnContact,
      sortOrder: dto.sortOrder,
    };
  }

  private massData(dto: MassDto) {
    return {
      dayLabel: dto.dayLabel.trim(),
      time: dto.time.trim(),
      location: dto.location.trim(),
      note: dto.note.trim(),
      period: dto.period,
      sortOrder: dto.sortOrder,
    };
  }

  private ministryData(dto: MinistryDto) {
    const linkUrl = this.optionalUrl(dto.linkUrl, 'Lien');
    const linkLabel = emptyToNull(dto.linkLabel);
    if (linkUrl && !linkLabel) {
      throw new HttpException('Le lien a besoin d’un intitulé.', HttpStatus.BAD_REQUEST);
    }
    return {
      slug: slugify(dto.slug?.trim() || dto.title),
      title: dto.title.trim(),
      body: dto.body.trim(),
      linkLabel,
      linkUrl,
      sortOrder: dto.sortOrder,
    };
  }

  private optionalUrl(value: string | null | undefined, label: string): string | null {
    const url = emptyToNull(value);
    if (!url) return null;
    assertSafeUrl(url, label);
    return url;
  }

  private steps(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private limited(ip: string): boolean {
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((time) => now - time < 60 * 60 * 1000);
    if (recent.length >= 8) {
      this.hits.set(ip, recent);
      return true;
    }
    recent.push(now);
    this.hits.set(ip, recent);
    return false;
  }

  private parsePeriod(kind: SheetKind, periodStart: string) {
    try {
      return sheetPeriod(kind, periodStart);
    } catch {
      throw new BadRequestException('Date invalide.');
    }
  }

  private presentSheet(
    sheet: {
      id: string;
      kind: string;
      title: string;
      periodStart: Date;
      originalName: string;
      size: number;
      published: boolean;
      source: string;
    },
    includeState: boolean,
  ) {
    return {
      id: sheet.id,
      kind: sheet.kind,
      title: sheet.title,
      periodStart: sheet.periodStart,
      originalName: sheet.originalName,
      size: sheet.size,
      source: sheet.source,
      ...(includeState ? { published: sheet.published } : {}),
    };
  }

  private async write<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Cet identifiant existe déjà.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Élément introuvable.');
      }
      throw error;
    }
  }

  private remove(action: () => Promise<unknown>) {
    return this.write(async () => {
      await action();
      return { ok: true };
    });
  }
}
