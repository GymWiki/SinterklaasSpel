import type { Tag } from './tags';

/** Prikkelvragen + gekoppelde aanloopzinnen voor /join. */
export interface Prompt {
  q: string;
  lead: string;
  example: string;
  tags: Tag[];
}

export const SECRET_PROMPTS: Prompt[] = [
  { q: 'Wat was de grootste blunder van deze persoon het afgelopen jaar?', lead: 'Deze persoon heeft dit jaar stiekem', example: 'de autosleutels in de kofferbak laten liggen en moest bellen voor hulp', tags: ['a'] },
  { q: 'Welke miskoop heeft deze persoon gedaan waar hij of zij nog steeds niet over praat?', lead: 'Deze persoon kocht dit jaar een', example: 'dure hometrainer die nu dienstdoet als kapstok', tags: ['a'] },
  { q: 'Welke vreemde gewoonte heeft deze persoon die bijna niemand weet?', lead: 'Deze persoon heeft de vreemde gewoonte om', example: 'bij het tandenpoetsen door het hele huis te lopen', tags: ['a'] },
  { q: 'Wat gebeurde er op de laatste vakantie van deze persoon?', lead: 'Op vakantie heeft deze persoon', example: 'drie uur gezocht naar een hotel dat aan de overkant van de straat bleek te liggen', tags: ['a'] },
  { q: 'Wat is een typische uitspraak van deze persoon?', lead: 'Deze persoon zegt altijd', example: '"ik ben over vijf minuten klaar" en is dan nog niet eens begonnen', tags: ['a'] },
  { q: 'Waar moet je deze persoon nooit mee laten helpen?', lead: 'Vraag deze persoon nooit om', example: 'iets in elkaar te zetten, want er blijven altijd schroefjes over', tags: ['a'] },
  { q: 'Waar kun je op wedden dat deze persoon vanavond mee komt?', lead: 'De kans is 100% dat deze persoon vanavond', example: 'als eerste de pepernoten leegeet en zogenaamd niks heeft gezien', tags: ['a'] },
  { q: 'Wat is het gekste dat deze persoon ooit in de keuken deed?', lead: 'Deze persoon heeft ooit in de keuken', example: 'zout met suiker verward en het hele gezin de taart laten opeten', tags: ['a'] },
  { q: 'Wat deed deze persoon als kind waar de familie nog om lacht?', lead: 'Als kind heeft deze persoon', example: 'de schoen van Sinterklaas zo vol met wortels gestopt dat het paard moest overgeven', tags: ['k', 'm'] },
  { q: 'Welk dier of welke gekke stem doet deze persoon heel goed (of heel slecht)?', lead: 'Deze persoon kan heel goed de stem nadoen van', example: 'een verkouden koe in de mist', tags: ['k', 'm'] },
  { q: 'Welke smoes gebruikte deze persoon dit jaar om niet naar een verjaardag te hoeven?', lead: 'Deze persoon verzon dit jaar de smoes dat', example: 'zijn hond een afspraak bij de dokter had', tags: ['m', 'v'] },
  { q: 'Wat heeft deze persoon dit jaar met zijn of haar telefoon gedaan dat niemand had moeten zien?', lead: 'Deze persoon heeft per ongeluk', example: 'een ruzie-appje naar de verkeerde groepsapp gestuurd', tags: ['m', 'v'] },
  { q: 'Waar is deze persoon stiekem heel slecht in, maar doet hij of zij alsof dat niet zo is?', lead: 'Deze persoon doet alsof hij of zij goed is in', example: 'parkeren, maar rijdt altijd drie keer om het blok', tags: ['m', 'v'] },
  { q: 'Wat is het meest gênante dat deze persoon dit jaar overkwam?', lead: 'Het meest gênante moment van deze persoon was toen hij of zij', example: 'in een overvolle trein hard meezong met koptelefoon op', tags: ['m', 'v'] },
  { q: 'Over welke date, ex of flirt moet deze persoon nog steeds zijn mond houden?', lead: 'Deze persoon heeft ooit', example: 'per ongeluk een hartje teruggestuurd naar iemand die nooit zou mogen weten', tags: ['v'] },
  { q: 'Welke dronken actie van deze persoon vergeet niemand?', lead: 'Na een paar glazen heeft deze persoon ooit', example: 'een toespraak gehouden voor een volslagen vreemde in de kroeg', tags: ['v'] },
  { q: 'Welk geheim heeft deze persoon dit jaar bijna laten uitlekken?', lead: 'Deze persoon is er dit jaar bijna achter gekomen dat', example: 'iedereen ons spaarvarken allang had leeggehaald', tags: ['v'] },
];

export const POEM_PROMPTS: Prompt[] = [
  { q: 'Schrijf een rijmpje over een blunder van deze persoon.', lead: 'Sint zag het in zijn grote boek:', example: 'jij reed drie keer langs het huis, op zoek!', tags: ['a'] },
  { q: 'Schrijf een gedichtje over een gekke gewoonte van deze persoon.', lead: 'Er is iemand hier, dat weet ik wel,', example: 'die lacht om alles en snurkt in een hotel.', tags: ['a'] },
  { q: 'Schrijf een rijmpje over de lievelingseten van deze persoon.', lead: 'Ach lieve schat, wat eet je graag,', example: 'de hele pot pepernoten, elke dag.', tags: ['a'] },
  { q: 'Schrijf een rijmpje over iets dat deze persoon altijd kwijt is.', lead: 'Sinterklaas weet het, ja ja ja,', example: 'je sleutels zijn weer eens ergens anders dan hier.', tags: ['k', 'm'] },
  { q: 'Schrijf een rijmpje over wat deze persoon dit jaar deed waar je om moest lachen.', lead: 'Piet heeft goed opgelet dit jaar,', example: 'en hij zag jou doen wat nooit mocht, dat is waar.', tags: ['m', 'v'] },
  { q: 'Schrijf een pittig rijmpje over iets wat deze persoon liever geheim houdt.', lead: 'In het boek van Sint staat een pikante zaak,', example: 'die jij liever niet vertelt aan de buurman en zijn vrouw, o wee, o wee!', tags: ['v'] },
];

export const POEM_LEADS_HINT = 'Tip: laat de laatste regel rijmen op de aanloopzin!';

/** Kant-en-klare stellingen: de deelnemer kiest alleen de schuldige. */
export interface Statement {
  text: string;
  tags: Tag[];
}
export const STATEMENTS: Statement[] = [
  { text: 'Deze persoon heeft dit jaar minstens één keer een afspraak vergeten en deed alsof er niks aan de hand was.', tags: ['a'] },
  { text: 'Deze persoon kan geen cadeaus inpakken en gebruikt daarom altijd veel te veel plakband.', tags: ['a'] },
  { text: 'Deze persoon zegt "ik ben er bijna" terwijl hij of zij nog niet eens is vertrokken.', tags: ['a'] },
  { text: 'Deze persoon heeft zijn of haar sleutels, telefoon of bril dit jaar al meer dan tien keer gezocht.', tags: ['a'] },
  { text: 'Deze persoon eet stiekem de lekkerste pepernoten uit de pot en doet alsof het de kat was.', tags: ['a'] },
  { text: 'Deze persoon stuurt weleens een appje naar de verkeerde persoon.', tags: ['a'] },
  { text: 'Deze persoon valt altijd als eerste in slaap voor de tv en ontkent dat daarna keihard.', tags: ['a'] },
  { text: 'Deze persoon heeft dit jaar iets nieuws gekocht en het nog nooit gebruikt.', tags: ['a'] },
  { text: 'Deze persoon is nog steeds een beetje bang voor het donker.', tags: ['k', 'm'] },
  { text: 'Deze persoon heeft als kind ooit stiekem de schoen van een ander leeggehaald.', tags: ['k', 'm'] },
  { text: 'Deze persoon zingt onder de douche hard en vals de nieuwste hits mee.', tags: ['k', 'm'] },
  { text: 'Deze persoon heeft vroeger geprobeerd om Sinterklaas te vangen met een val.', tags: ['k'] },
  { text: 'Deze persoon durft niet alleen naar de WC als het donker is.', tags: ['k'] },
  { text: 'Deze persoon doet zijn of haar tanden nooit zo lang als de tandarts zegt.', tags: ['k'] },
  { text: 'Deze persoon heeft dit jaar stiekem een dagje vrij genomen en gezegd dat hij of zij ziek was.', tags: ['m', 'v'] },
  { text: 'Deze persoon heeft zijn of haar eigen verjaardag bijna vergeten.', tags: ['m'] },
  { text: 'Deze persoon googelt weleens zijn of haar eigen naam.', tags: ['m', 'v'] },
  { text: 'Deze persoon heeft een hele serie gekeken en doet alsof hij of zij hem al lang uit had.', tags: ['m', 'v'] },
  { text: 'Deze persoon zou vanavond stiekem een cadeau doorgeven aan iemand anders.', tags: ['m', 'v'] },
  { text: 'Deze persoon heeft dit jaar iets stuk gemaakt van iemand anders en het nooit verteld.', tags: ['v'] },
  { text: 'Deze persoon heeft op een feestje ooit iets gezegd waar iedereen nog steeds om lacht.', tags: ['v'] },
  { text: 'Deze persoon heeft ooit een date laten zitten met een nogal flauwe smoes.', tags: ['v'] },
  { text: 'Deze persoon zou na een paar glazen als eerste bij de karaoke staan.', tags: ['v'] },
  { text: 'Deze persoon heeft dit jaar minstens één keer te veel gedronken en niet meer geweten hoe thuis te komen.', tags: ['v'] },
  { text: 'Deze persoon heeft zijn of haar baas dit jaar een keer flink voorgelogen.', tags: ['v'] },
];
