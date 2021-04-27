import { join as joinPaths } from 'path';
import parseCsv from 'csv-parse';
import { downloadsDir } from '../directories';
import { downloadFile } from '../utils/download-file';
import { createReadStream } from 'fs';
import { Language } from '../language';
import { alpha3TToAlpha2 } from '@cospired/i18n-iso-languages';
import { DefaultMap } from '../utils/default-map';
import memoize from 'memoizee';

// Phoible (https://phoible.org/) is a linguistic database. For each language, it contains zero or
// more "inventories". Each inventory is one possible way of grouping this language's sounds into
// phonemes.
// Phoible data is used to generate statistics to help a developer choose the phonemes for a
// language.

export type PhoibleData = ReadonlyMap<Language, PhoibleInventory[]>;

export interface PhoibleInventory {
  id: number;
  name: string;
  language: Language;
  corePhonemes: string[];
  marginalPhonemes: string[];
}

export const getPhoibleData = memoize(
  async (): Promise<PhoibleData> => {
    // Create CSV stream for Phoible data
    const phoibleFilePath = joinPaths(downloadsDir, 'phoible.csv');
    await downloadFile(
      'https://raw.githubusercontent.com/phoible/dev/master/data/phoible.csv',
      phoibleFilePath,
      { description: 'Phoible data', skipIfExists: true },
    );
    const csvStream = createReadStream(phoibleFilePath).pipe(
      parseCsv({ columns: true }),
    );

    // Read Phoible inventories
    const inventoriesById = new Map<string, PhoibleInventory>();
    for await (const row of csvStream) {
      const language = alpha3TToAlpha2(row.ISO6393);
      if (language === undefined) continue;

      const inventoryId = row.InventoryID;
      const inventory = getOrCreate(inventoriesById, inventoryId, () => ({
        id: inventoryId,
        name: row.LanguageName, // The "LanguageName" entry really is the inventory name
        language,
        corePhonemes: [],
        marginalPhonemes: [],
      }));

      const marginal = row.Marginal === 'TRUE';
      // Some inventories contain multiple variations of the same phoneme. Ignore all but the first.
      const phoneme = (row.Phoneme as string).split('|')[0];
      (marginal ? inventory.marginalPhonemes : inventory.corePhonemes).push(
        phoneme,
      );
    }

    // Group inventories by language
    const result = new DefaultMap<Language, PhoibleInventory[]>(() => []);
    for (const inventory of inventoriesById.values()) {
      result.getOrCreate(inventory.language).push(inventory);
    }
    return result;
  },
);

function getOrCreate<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
  createValue: (key: TKey) => TValue,
): TValue {
  if (map.has(key)) return map.get(key)!;

  const value = createValue(key);
  map.set(key, value);
  return value;
}
