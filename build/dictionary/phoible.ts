import { join as joinStrings } from 'path';
import memoize from 'memoizee';
import parseCsv from 'csv-parse';
import { alpha3TToAlpha2 } from '@cospired/i18n-iso-languages';
import { downloadFile } from '../utils/download-file';
import { downloadsDir } from '../directories';
import { createReadStream } from 'fs';
import { Language } from '../language';
import { DefaultMap } from '../utils/default-map';
import { ipaSymbols } from '../lookups/ipa-symbols';

export type PhoibleData = DefaultMap<Language, PhoibleLanguageRecord>;

export interface PhoibleLanguageRecord {
  language: Language;
  inventories: DefaultMap<PhoibleInventoryId, PhoibleInventory>;
}

export type PhoibleInventoryId = number;

export interface PhoibleInventory {
  inventoryId: PhoibleInventoryId;
  inventoryName: string;
  language: Language;
  entries: PhoibleInventoryEntry[];
}

export interface PhoibleInventoryEntry {
  /** Phoneme, simplified to segmental IPA symbols */
  phoneme: string;

  /** Allophones, simplified to segmental IPA symbols */
  allophones: string[];
}

export const getPhoibleData = memoize(
  async function getPhoibleData(): Promise<PhoibleData> {
    const mappingsFilePath = joinStrings(downloadsDir, 'phoible-mappings.csv');
    await downloadFile(
      'https://raw.githubusercontent.com/phoible/dev/712bbb8e75adba5f58e0752124448e1afe56ed34/mappings/InventoryID-LanguageCodes.csv',
      mappingsFilePath,
      { description: 'Phoible mappings', skipIfExists: true },
    );

    const mappingsStream = createReadStream(mappingsFilePath).pipe(
      parseCsv({ columns: true }),
    );
    const inventoryNamesById = new Map<PhoibleInventoryId, string>();
    for await (const row of mappingsStream) {
      const inventoryId = parseInt(row.InventoryID, 10);
      const inventoryName: string = row.LanguageName;
      inventoryNamesById.set(inventoryId, inventoryName);
    }

    const dataFilePath = joinStrings(downloadsDir, 'phoible.csv');
    await downloadFile(
      'https://raw.githubusercontent.com/phoible/dev/master/data/phoible.csv',
      dataFilePath,
      { description: 'Phoible data', skipIfExists: true },
    );

    const data: PhoibleData = new DefaultMap(language => ({
      language,
      inventories: new DefaultMap(inventoryId => ({
        inventoryId,
        inventoryName: inventoryNamesById.get(inventoryId)!,
        language,
        entries: [],
      })),
    }));

    const dataStream = createReadStream(dataFilePath).pipe(
      parseCsv({ columns: true }),
    );
    for await (const row of dataStream) {
      const inventoryId = parseInt(row.InventoryID, 10);

      const language = alpha3TToAlpha2(row.ISO6393);
      if (language === undefined) continue;

      const phoneme = simplifyIpa(row.Phoneme);
      const allophones = [
        ...new Set(
          (row.Allophones as string)
            .split(' ')
            .map(simplifyIpa)
            .filter(Boolean),
        ),
      ];

      data
        .getOrCreate(language)
        .inventories.getOrCreate(inventoryId)
        .entries.push({ phoneme, allophones });
    }

    return data;
  },
);

function simplifyIpa(ipaString: string): string {
  return [...ipaString].filter(char => ipaSymbols.has(char)).join('');
}
