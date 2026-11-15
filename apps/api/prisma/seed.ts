import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const settings = {
  id: 1,
  name: 'Paroisse Saint-Nicolas du Rhône',
  shortName: 'Saint-Nicolas du Rhône',
  domain: 'stnicolasdurhone.fr',
  siteUrl: 'https://stnicolasdurhone.fr',
  diocese: 'Diocèse de Viviers',
  dioceseUrl: 'https://ardeche.catholique.fr/',
  parishOnDioceseUrl: 'https://ardeche.catholique.fr/saint-nicolas-du-rhone/',
  donationsUrl: 'https://ardeche.catholique.fr/page-accueil-dons/',
  bequestsUrl: 'https://ardeche.catholique.fr/legs/',
  readingsUrl: 'https://www.aelf.org/',
  sector: 'Moyenne vallée du Rhône',
  bishop: 'Mgr Hervé Giraud',
  email: 'stnicolas@orange.fr',
  phone: '04 75 62 40 95',
  street: '13, rue Boissy d’Anglas',
  postalCode: '07800',
  city: 'La Voulte-sur-Rhône',
  hours: 'Du mardi au vendredi, de 9h30 à 11h',
  mapUrl:
    'https://www.openstreetmap.org/search?query=13%20rue%20Boissy%20d%27Anglas%207800%20La%20Voulte-sur-Rh%C3%B4ne',
  presbyteryStreet: '1, place de l’Église',
  heroLede:
    'Dix communes, une même communauté, entre le fleuve et les coteaux. Messes, sacrements et vie paroissiale, à partir de La Voulte-sur-Rhône et du Pouzin.',
  aboutText:
    'La paroisse porte le nom de saint Nicolas, évêque de Myre, fêté le 6 décembre. On l’invoque comme protecteur des enfants et des marins : un patronage qui fait écho au fleuve, longtemps parcouru par les bateliers, et aux familles qui grandissent ici.\n\nL’évêque du diocèse est Mgr Hervé Giraud. La paroisse appartient au secteur de la moyenne vallée du Rhône, avec les paroisses Saint-Pierre de Crussol et Saint-Luc des coteaux et de Tournon.',
  teamIntro:
    'Autour du père Bernard Jobert, prêtres, diacres et laïcs portent la vie de la paroisse. Pour les joindre, le plus simple reste le secrétariat.',
  teamCouncils:
    'L’équipe d’animation pastorale éclaire, avec le curé, les orientations de la paroisse : catéchèse, célébrations, accueil, solidarité. Des baptisés y siègent à ce titre.\n\nLe conseil économique gère l’argent et les bâtiments. Il est présidé par le curé. Le trésorier est Bernard Barrallon, le comptable Jean-Pierre Bellot.',
  massIntro:
    'Les messes du dimanche changent de clocher selon les semaines. Celles de la semaine suivent un rythme plus stable. En cas de doute, le secrétariat répond.',
  sacramentIntro:
    'Chaque démarche commence par un échange. Le secrétariat oriente vers le prêtre ou l’équipe concernée.',
  lifeIntro:
    'La paroisse ne se réduit pas aux messes du dimanche. Enfants, adultes en recherche et personnes isolées y ont une place. Pour rejoindre une équipe, on passe par le secrétariat.',
  donateIntro:
    'Deux gestes distincts font vivre l’Église locale. Le denier rémunère les prêtres et soutient la mission du diocèse. La quête et les dons à la paroisse paient le quotidien : chauffage des églises, fleurs, catéchèse, cahiers, entretien.',
  welcomeDetail:
    'Pour un certificat, une intention de messe, un baptême ou une simple question.',
  publicationDirector: 'Père Bernard Jobert, curé',
  hostNote:
    'Le nom de l’hébergeur sera indiqué ici au moment de la mise en ligne sur stnicolasdurhone.fr.',
  denierEmail: 'denier.eveche@ardeche.catholique.fr',
};

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'pbernard.jobert@yahoo.fr').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD doit être défini dans apps/api/.env');
  }
  const firstName = process.env.ADMIN_FIRST_NAME ?? 'Bernard';
  const lastName = process.env.ADMIN_LAST_NAME ?? 'Jobert';
  const legacy = await prisma.user.findUnique({ where: { email: 'admin@stnicolasdurhone.fr' } });
  if (legacy && legacy.email !== email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (!taken) {
      await prisma.user.update({
        where: { id: legacy.id },
        data: { email, firstName, lastName },
      });
    }
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }

  const existingSettings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!existingSettings) await prisma.settings.create({ data: settings });

  if ((await prisma.place.count()) === 0) {
    await prisma.place.createMany({
      data: [
        { town: 'La Voulte-sur-Rhône', kind: 'fleuve', church: 'Église Saint-Vincent', address: 'Place de l’Église', note: 'Siège du secrétariat. Messe dominicale la plus régulière, le dimanche à 10h30.', sortOrder: 1 },
        { town: 'Le Pouzin', kind: 'fleuve', church: 'Église du Pouzin', note: 'Messes en semaine et messe dominicale certains dimanches.', sortOrder: 2 },
        { town: 'Charmes-sur-Rhône', kind: 'fleuve', church: 'Église Saint-Pierre-aux-Liens', address: 'Rue de l’Église', note: 'Messe certains dimanches à 10h30, et le jeudi soir.', sortOrder: 3 },
        { town: 'Beauchastel', kind: 'fleuve', church: 'Chapelle', address: 'Rue des Jardins', note: 'Messe anticipée du samedi, en alternance avec d’autres clochers.', sortOrder: 4 },
        { town: 'Saint-Georges-les-Bains', kind: 'fleuve', church: 'Église', address: 'Rue Vincent d’Indy', note: 'Messe anticipée du samedi, en alternance.', sortOrder: 5 },
        { town: 'Saint-Laurent-du-Pape', kind: 'fleuve', church: 'Église', address: 'Place de l’Église', note: 'Messe anticipée du samedi, en alternance.', sortOrder: 6 },
        { town: 'Baix', kind: 'fleuve', note: 'Commune de la paroisse, au sud du Pouzin.', sortOrder: 7 },
        { town: 'Rompon', kind: 'coteaux', note: 'Commune de la paroisse, dans l’arrière-pays du Pouzin.', sortOrder: 8 },
        { town: 'Gilhac-et-Bruzac', kind: 'coteaux', note: 'Commune des coteaux rattachée à la paroisse.', sortOrder: 9 },
        { town: 'Saint-Cierge-la-Serre', kind: 'coteaux', note: 'Commune des coteaux rattachée à la paroisse.', sortOrder: 10 },
      ],
    });
  }

  if ((await prisma.person.count()) === 0) {
    await prisma.person.createMany({
      data: [
        { name: 'Père Bernard Jobert', role: 'Curé', detail: 'Installé le 6 septembre 2025. Il réside à La Voulte-sur-Rhône.', phone: '06 98 82 83 03', groupName: 'ministre', showOnContact: true, sortOrder: 1 },
        { name: 'Père Charles Rochette', role: 'Prêtre retraité', detail: 'Il continue de servir la paroisse.', phone: '04 75 63 80 60', groupName: 'ministre', showOnContact: true, sortOrder: 2 },
        { name: 'Michel Rey', role: 'Diacre permanent', detail: 'Charmes-sur-Rhône', email: 'reymichel@netcourrier.com', groupName: 'ministre', sortOrder: 3 },
        { name: 'Ludovic Fraisse', role: 'Diacre permanent', detail: 'Charmes-sur-Rhône', email: 'marieloludo.fraisse@free.fr', groupName: 'ministre', sortOrder: 4 },
        { name: 'Jean-Pierre Bellot', role: 'Comptable paroissial', groupName: 'curie', sortOrder: 5 },
        { name: 'Bernard Barrallon', role: 'Trésorier paroissial', groupName: 'curie', sortOrder: 6 },
        { name: 'Jeanine Brun', role: 'Notaire paroissiale', groupName: 'curie', sortOrder: 7 },
        { name: 'Marie-Noëlle Pontal', role: 'Notaire paroissiale', groupName: 'curie', sortOrder: 8 },
      ],
    });
  }

  if ((await prisma.massTime.count()) === 0) {
    await prisma.massTime.createMany({
      data: [
        { dayLabel: 'Dimanche', time: '10h30', location: 'Église Saint-Vincent, La Voulte-sur-Rhône', note: 'Le rendez-vous le plus régulier de la paroisse.', period: 'sunday', sortOrder: 1 },
        { dayLabel: 'Certains dimanches', time: '10h30', location: 'Charmes-sur-Rhône et Le Pouzin', note: 'Selon le calendrier du mois.', period: 'sunday', sortOrder: 2 },
        { dayLabel: 'Samedi', time: '18h00 ou 18h30', location: 'Saint-Laurent-du-Pape, Beauchastel ou Saint-Georges-les-Bains', note: 'Messe anticipée, en alternance d’un samedi à l’autre.', period: 'sunday', sortOrder: 3 },
        { dayLabel: 'Mardi', time: '9h00', location: 'Le Pouzin et chapelle de Beauchastel', period: 'weekday', sortOrder: 4 },
        { dayLabel: 'Mercredi', time: '9h00', location: 'Le Pouzin et chapelle de Beauchastel', period: 'weekday', sortOrder: 5 },
        { dayLabel: 'Jeudi', time: '9h00', location: 'Le Pouzin', period: 'weekday', sortOrder: 6 },
        { dayLabel: 'Jeudi', time: '18h00', location: 'Charmes-sur-Rhône', period: 'weekday', sortOrder: 7 },
        { dayLabel: 'Vendredi', time: '9h00', location: 'Le Pouzin', period: 'weekday', sortOrder: 8 },
        { dayLabel: 'Vendredi', time: '18h00', location: 'Chapelle de Beauchastel', period: 'weekday', sortOrder: 9 },
        { dayLabel: 'Samedi', time: '9h00', location: 'La Voulte, église Saint-Vincent — suivi d’un petit-déjeuner partagé', period: 'weekday', sortOrder: 10 },
      ],
    });
  }

  if ((await prisma.article.count()) === 0) {
    await prisma.article.createMany({
      data: [
        {
          slug: 'le-site-de-la-paroisse-ouvre',
          title: 'Le site de la paroisse est en ligne',
          publishedAt: new Date('2026-10-18T12:00:00+02:00'),
          category: 'Annonce',
          excerpt: 'Horaires, sacrements, vie de la paroisse et contact du secrétariat : l’essentiel est réuni sur stnicolasdurhone.fr.',
          body: 'La paroisse Saint-Nicolas du Rhône dispose désormais de son site, à l’adresse stnicolasdurhone.fr. Il est fait pour celles et ceux qui cherchent une messe, préparent un baptême, un mariage ou des funérailles, ou simplement veulent rejoindre la communauté.\n\nOn y trouve les dix communes, l’équipe, les horaires habituels et les démarches les plus courantes. Les messes du dimanche tournent selon les clochers : le secrétariat reste le bon réflexe pour confirmer le lieu de la semaine.\n\nUne information à corriger, une date à ajouter, une équipe à faire connaître ? Écrivez à stnicolas@orange.fr. Le site est prévu pour être mis à jour depuis l’administration, sans repasser par un outil compliqué.',
        },
        {
          slug: 'visite-pastorale-mgr-giraud',
          title: 'Mgr Hervé Giraud en visite dans la paroisse',
          publishedAt: new Date('2026-04-26T12:00:00+02:00'),
          category: 'Vie de la paroisse',
          excerpt: 'Les 25 et 26 avril 2026, l’évêque de Viviers est venu à la rencontre des paroissiens, à l’invitation du père Bernard Jobert et de son équipe.',
          sourceLabel: 'Récit publié par le diocèse de Viviers',
          sourceUrl: 'https://ardeche.catholique.fr/visite-de-la-paroisse-st-nicolas-du-rhone/',
          body: 'Les 25 et 26 avril 2026, Mgr Hervé Giraud a passé un week-end dans la paroisse, à l’invitation du père Bernard Jobert et de l’équipe paroissiale. Le samedi a été un temps de rencontre, avec notamment un déplacement sur le Rhône.\n\nLe dimanche, de nombreux fidèles se sont rassemblés pour la messe, en ce dimanche du Bon Pasteur. L’évêque a aussi échangé avec les bénévoles du Secours catholique, avec la communauté musulmane, et avec des adultes qui cheminent vers le baptême.\n\nLa journée s’est prolongée en musique, puis autour d’un temps convivial avec les paroissiens et les élus des communes.',
        },
        {
          slug: 'installation-du-pere-bernard-jobert',
          title: 'Le père Bernard Jobert, curé de la paroisse',
          publishedAt: new Date('2025-09-06T12:00:00+02:00'),
          category: 'Vie de la paroisse',
          excerpt: 'Le père Bernard Jobert a été installé curé de Saint-Nicolas du Rhône le 6 septembre 2025. Il réside à La Voulte-sur-Rhône.',
          sourceLabel: 'Agenda du diocèse de Viviers',
          sourceUrl: 'https://ardeche.catholique.fr/date/installation-cure-de-la-paroisse-st-nicolas-du-rhone/',
          body: 'Le 6 septembre 2025, le père Bernard Jobert a été installé curé de la paroisse Saint-Nicolas du Rhône. Il succède au père William Astic et réside à La Voulte-sur-Rhône, place de l’Église.\n\nLe père Charles Rochette, prêtre retraité, et les diacres Michel Rey et Ludovic Fraisse continuent de servir la paroisse avec lui.\n\nPour le joindre : le secrétariat, du mardi au vendredi matin, ou directement au 06 98 82 83 03.',
        },
      ],
    });
  }

  if ((await prisma.event.count()) === 0) {
    await prisma.event.createMany({
      data: [
        { startsAt: new Date('2026-11-01T10:30:00+01:00'), title: 'Toussaint', location: 'Lieu annoncé par le secrétariat', kind: 'Liturgie', detail: 'Messe de la Toussaint. L’horaire et l’église sont confirmés dans les jours qui précèdent.' },
        { startsAt: new Date('2026-11-02T18:00:00+01:00'), title: 'Commémoration de tous les fidèles défunts', location: 'Lieu annoncé par le secrétariat', kind: 'Liturgie', detail: 'Journée de prière pour les défunts. Les familles peuvent faire inscrire un prénom auprès du secrétariat.' },
        { startsAt: new Date('2026-11-22T10:30:00+01:00'), title: 'Christ Roi de l’univers', location: 'Selon le calendrier dominical', kind: 'Liturgie', detail: 'Dernier dimanche de l’année liturgique.' },
        { startsAt: new Date('2026-11-29T10:30:00+01:00'), title: 'Premier dimanche de l’Avent', location: 'Selon le calendrier dominical', kind: 'Liturgie', detail: 'Début de la nouvelle année liturgique.' },
        { startsAt: new Date('2026-12-06T10:30:00+01:00'), title: 'Fête de saint Nicolas', location: 'Selon le calendrier dominical', kind: 'Paroisse', detail: 'Saint Nicolas, évêque de Myre, est le patron de la paroisse. Il est fêté le 6 décembre.' },
        { startsAt: new Date('2026-12-24T18:00:00+01:00'), title: 'Veillée de Noël', location: 'Lieu et heure annoncés par le secrétariat', kind: 'Liturgie', detail: 'Messe de la Nativité. Les horaires des messes de Noël sont publiés début décembre.' },
        { startsAt: new Date('2026-12-25T10:30:00+01:00'), title: 'Noël', location: 'Lieu et heure annoncés par le secrétariat', kind: 'Liturgie', detail: 'Messe du jour de Noël.' },
      ],
    });
  }

  if ((await prisma.sacrament.count()) === 0) {
    await prisma.sacrament.createMany({
      data: [
        { slug: 'bapteme', title: 'Baptême des enfants', sortOrder: 1, text: 'Le baptême fait entrer l’enfant dans la vie du Christ et dans la communauté. Il se prépare avec les parents, et si possible avec le parrain et la marraine.', steps: ['Téléphoner ou écrire au secrétariat, dès que la date envisagée se précise.', 'Rencontrer le prêtre ou un membre de l’équipe de préparation.', 'Choisir un parrain et une marraine, dont au moins l’un est baptisé et confirmé.', 'Apporter, lors du rendez-vous, le livret de famille. Les autres pièces sont indiquées à ce moment-là.'] },
        { slug: 'catechumenat', title: 'Baptême des adultes et des adolescents', sortOrder: 2, text: 'On peut demander le baptême à tout âge. Le catéchuménat est un chemin de plusieurs mois : écoute de l’Évangile, prière, rencontres, et accompagnement par un paroissien.', steps: ['Prendre contact avec le secrétariat, sans dossier à préparer d’avance.', 'Rencontrer le curé pour dire d’où l’on vient et ce que l’on cherche.', 'Rejoindre le groupe des catéchumènes et, si on le souhaite, un accompagnateur.', 'Les baptêmes d’adultes sont célébrés en lien avec le diocèse, souvent dans le temps de Pâques.'] },
        { slug: 'eucharistie', title: 'Première communion et confirmation', sortOrder: 3, text: 'Les enfants de la paroisse sont invités à la catéchèse, puis à la première des communions et, plus tard, à la confirmation. Les âges et les jours de rencontre sont donnés à chaque rentrée.', steps: ['Inscrire l’enfant auprès du secrétariat en début d’année.', 'Participer aux rencontres de catéchèse et à la messe dominicale.', 'Les parents sont associés aux temps forts de la préparation.'] },
        { slug: 'mariage', title: 'Mariage', sortOrder: 4, text: 'Le mariage chrétien se prépare longtemps à l’avance. La paroisse accueille les couples qui habitent l’une des dix communes, et ceux qui ont un lien réel avec l’une de ses églises.', steps: ['Contacter le secrétariat plusieurs mois avant la date souhaitée, idéalement un an.', 'Rencontrer le prêtre, puis suivre la préparation proposée par la paroisse ou le diocèse.', 'Constituer le dossier : pièces d’identité, actes de baptême récents si les fiancés sont baptisés, et les documents demandés par la mairie.', 'Si l’un des deux n’est pas baptisé, ou si l’un est divorcé, la situation se regarde avec le prêtre : venez en parler sans attendre.'] },
        { slug: 'reconciliation', title: 'Réconciliation', sortOrder: 5, text: 'Le sacrement du pardon est proposé avant les grandes fêtes et sur rendez-vous. On peut aussi demander à se confesser à l’issue d’une messe de semaine.', steps: ['Demander un horaire au secrétariat, surtout avant Noël et Pâques.', 'Ou en parler au prêtre à la fin de la messe.'] },
        { slug: 'malades', title: 'Sacrement des malades', sortOrder: 6, text: 'Ce sacrement soutient la personne éprouvée par la maladie ou l’âge. Il peut être célébré à domicile, à l’hôpital ou en maison de retraite, et pas seulement à l’approche de la mort.', steps: ['Appeler le secrétariat ou le curé, y compris le week-end en cas d’urgence.', 'La pastorale de la santé rejoint aussi les résidents, notamment à l’Ehpad Rivoly.'] },
        { slug: 'funerailles', title: 'Funérailles', sortOrder: 7, text: 'La paroisse accompagne les familles au moment d’un décès : prière, messe ou célébration, et lien avec les pompes funèbres. Rien n’est à préparer seul.', steps: ['Prévenir le secrétariat ou le père Bernard Jobert dès que la date se dessine.', 'Choisir, avec le prêtre ou le diacre, une messe ou une liturgie de la Parole.', 'Les registres et les actes sont tenus par les notaires paroissiaux.'] },
      ],
    });
  }

  if ((await prisma.ministry.count()) === 0) {
    await prisma.ministry.createMany({
      data: [
        { slug: 'catechese', title: 'Catéchèse', sortOrder: 1, body: 'L’éveil à la foi et la catéchèse sont proposés aux enfants des dix communes. Les jours, les lieux et les groupes de l’année sont communiqués à la rentrée, et rappelés au secrétariat.\n\nL’inscription se fait auprès de l’accueil paroissial. Les parents qui arrivent en cours d’année peuvent aussi appeler : une place se trouve presque toujours.' },
        { slug: 'catechumenat', title: 'Catéchuménat', sortOrder: 2, linkLabel: 'Voir la démarche', linkUrl: '/celebrer/sacrements#catechumenat', body: 'Des adultes et des adolescents cheminent vers le baptême, la première communion ou la confirmation. Ils sont accompagnés personnellement et se retrouvent pour écouter la Parole, prier et poser leurs questions.\n\nLors de sa visite des 25 et 26 avril 2026, Mgr Hervé Giraud a rencontré ces adultes en chemin. On peut les rejoindre à tout moment de l’année.' },
        { slug: 'sante', title: 'Pastorale de la santé', sortOrder: 3, body: 'Des paroissiens visitent les malades à domicile et les résidents des maisons de retraite, en particulier à l’Ehpad Rivoly. Ils portent la communion aux personnes qui ne peuvent plus se déplacer, et préviennent le prêtre lorsqu’un sacrement est demandé.\n\nPour signaler une personne isolée ou malade, appelez le secrétariat.' },
        { slug: 'servir', title: 'Secours catholique et services', sortOrder: 4, linkLabel: 'Écrire au secrétariat', linkUrl: 'mailto:stnicolas@orange.fr', body: 'Les bénévoles du Secours catholique font partie du paysage de la paroisse. Ils ont échangé avec l’évêque pendant la visite pastorale d’avril 2026. D’autres services — accueil, liturgie, visite, entretien des églises — tiennent grâce aux habitants.\n\nProposer une heure, un savoir-faire ou simplement sa présence : l’équipe vous dira où le besoin est le plus clair.' },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
