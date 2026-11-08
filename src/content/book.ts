import type { Tag } from './tags';

/** Fallback Grote Boek-vragen zodra de ingestuurde inzendingen op zijn. Reveal = groepsstemming. */
export interface BookQ {
  q: string;
  tags: Tag[];
}

export const BOOK_FALLBACK: BookQ[] = [
  { q: 'Wie in deze kamer zou als eerste per ongeluk de cadeaus aan de verkeerde mensen geven?', tags: ['a'] },
  { q: 'Wie in deze kamer valt het eerst in slaap als er een lange film wordt gekeken?', tags: ['a'] },
  { q: 'Wie in deze kamer zou het slechtst zijn in het verstoppen van een verrassing?', tags: ['a'] },
  { q: 'Wie in deze kamer eet de meeste pepernoten per avond?', tags: ['a'] },
  { q: 'Wie in deze kamer is altijd te laat, maar heeft altijd een goed excuus?', tags: ['a'] },
  { q: 'Wie in deze kamer zou het langst op een onbewoond eiland overleven?', tags: ['a'] },
  { q: 'Wie in deze kamer pakt cadeaus het voorzichtigst uit, zodat het papier heel blijft?', tags: ['a'] },
  { q: 'Wie in deze kamer zou het beste een Sinterklaas-gedicht kunnen schrijven?', tags: ['a'] },
  { q: 'Wie in deze kamer is het meest bang voor spinnen?', tags: ['k', 'm'] },
  { q: 'Wie in deze kamer kan het hardst "HO HO HO" roepen?', tags: ['k'] },
  { q: 'Wie in deze kamer zou stiekem het liefst op de stoomboot willen wonen?', tags: ['k'] },
  { q: 'Wie in deze kamer is het beste in verstoppertje spelen?', tags: ['k'] },
  { q: 'Wie in deze kamer zou het snelst een hele zak strooigoed opeten?', tags: ['k', 'm'] },
  { q: 'Wie in deze kamer zou het grappigst verkleed zijn als Sinterklaas?', tags: ['k', 'm'] },
  { q: 'Wie in deze kamer heeft de meeste foto\'s op zijn telefoon van zijn eigen eten?', tags: ['m'] },
  { q: 'Wie in deze kamer zou als eerste huilen bij een goede reclame?', tags: ['m'] },
  { q: 'Wie in deze kamer is het slechtst in het inpakken van cadeaus?', tags: ['m'] },
  { q: 'Wie in deze kamer zou een cadeau stiekem doorgeven aan iemand anders?', tags: ['m'] },
  { q: 'Wie in deze kamer rijdt het slechtst auto?', tags: ['m', 'v'] },
  { q: 'Wie in deze kamer zou het eerst winnen bij een eetwedstrijd?', tags: ['m', 'v'] },
  { q: 'Wie in deze kamer heeft de meeste ongelezen mails of appjes?', tags: ['m', 'v'] },
  { q: 'Wie in deze kamer zou als eerste een cadeau van de ander afpakken zonder schuldgevoel?', tags: ['m', 'v'] },
  { q: 'Wie in deze kamer heeft de slechtste smaak in muziek?', tags: ['v'] },
  { q: 'Wie in deze kamer zou als eerste dronken zijn na twee glazen?', tags: ['v'] },
  { q: 'Wie in deze kamer zou het snelst een ruzie beginnen over een bordspel?', tags: ['v'] },
  { q: 'Wie in deze kamer heeft het meeste geflirt zonder het door te hebben?', tags: ['v'] },
  { q: 'Wie in deze kamer zou het eerst geld lenen en het "vergeten" terug te geven?', tags: ['v'] },
  { q: 'Wie in deze kamer is het slechtst in geheimen bewaren?', tags: ['v'] },
  { q: 'Wie in deze kamer zou je meenemen naar een verjaardag waar je niet wilt blijven?', tags: ['v'] },
  { q: 'Wie in deze kamer heeft de meest twijfelachtige huiscadeau-smaak?', tags: ['v'] },
];

export const BOOK_FALLBACK_REVEAL = 'Tel af: 3, 2, 1... WIJS! De meest aangewezen persoon staat het mooiste cadeau af aan {A}!';
