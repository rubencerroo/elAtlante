/**
 * Pure table assignment logic — extracted for testability.
 * No Supabase dependency. All functions are pure.
 */

import {
  getTablesInArea,
  getAreasForPreference,
  type AreaId,
  type TableDef,
} from './tableConfig';

/**
 * Parse "HH:MM" to minutes from midnight.
 */
export function timeToMinutesLocal(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Given a list of reservation records with table_number and time,
 * compute the set of occupied table IDs within ±2h of the target time.
 */
export function computeOccupiedIds(
  reservations: { table_number: number | null; time: string }[],
  targetTime: string
): Set<number> {
  const targetMin = timeToMinutesLocal(targetTime);
  const occupied = new Set<number>();

  for (const r of reservations) {
    if (r.table_number == null) continue;
    const rMin = timeToMinutesLocal(r.time?.substring(0, 5) || '00:00');
    if (Math.abs(rMin - targetMin) < 120) {
      occupied.add(r.table_number);
    }
  }

  return occupied;
}

/**
 * Find the best single table or combination of tables in a given area.
 * Returns the table IDs to use, or null if no fit.
 */
export function findBestFitInArea(
  area: AreaId,
  guests: number,
  occupiedIds: Set<number>
): TableDef[] | null {
  const areaTables = getTablesInArea(area);
  const freeTables = areaTables.filter(t => !occupiedIds.has(t.id));

  if (freeTables.length === 0) return null;

  // 1. Single table — smallest capacity >= guests
  const singles = freeTables
    .filter(t => t.capacity >= guests)
    .sort((a, b) => a.capacity - b.capacity);

  if (singles.length > 0) {
    const bestCapacity = singles[0].capacity;
    const candidates = singles.filter(t => t.capacity === bestCapacity);

    if (candidates.length > 1 && occupiedIds.size > 0) {
      candidates.sort((a, b) => {
        const distA = Math.min(...Array.from(occupiedIds).map(id => Math.abs(id - a.id)));
        const distB = Math.min(...Array.from(occupiedIds).map(id => Math.abs(id - b.id)));
        return distB - distA; // Descending (furthest distance first)
      });
    } else if (candidates.length > 1 && occupiedIds.size === 0) {
      // Empty room scenario: pick the "middle" table visually to distribute instead of always #1
      return [candidates[Math.floor(candidates.length / 2)]];
    }

    return [candidates[0]];
  }

  // 2. Combining tables
  const sorted = [...freeTables].sort((a, b) => b.capacity - a.capacity);
  const combo: TableDef[] = [];
  let total = 0;

  for (const t of sorted) {
    combo.push(t);
    total += t.capacity;
    if (total >= guests) break;
  }

  if (total >= guests) {
    if (freeTables.length <= 10) {
      const bestCombo = findMinimalCombo(freeTables, guests);
      if (bestCombo) return bestCombo;
    }
    return combo;
  }

  return null;
}

/**
 * Find the combination of tables with minimum total capacity >= guests.
 * Bitmask enumeration — only for sets <= 10.
 */
export function findMinimalCombo(tables: TableDef[], guests: number): TableDef[] | null {
  const n = tables.length;
  const validCombos: { tables: TableDef[], totalCap: number, gap: number }[] = [];

  for (let mask = 1; mask < (1 << n); mask++) {
    let total = 0;
    const combo: TableDef[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        total += tables[i].capacity;
        combo.push(tables[i]);
      }
    }
    if (total >= guests) {
      const sortedIds = combo.map(t => t.id).sort((a, b) => a - b);
      const gap = sortedIds[sortedIds.length - 1] - sortedIds[0] - (sortedIds.length - 1);
      validCombos.push({ tables: combo, totalCap: total, gap });
    }
  }

  if (validCombos.length === 0) return null;

  validCombos.sort((a, b) => {
    if (a.gap !== b.gap) return a.gap - b.gap;
    return a.totalCap - b.totalCap;
  });

  return validCombos[0].tables;
}

/**
 * Build result from a list of assigned tables.
 */
export function buildResult(tables: TableDef[]): { tableNumber: number; combinedNote?: string; allTableIds: number[] } {
  const sorted = [...tables].sort((a, b) => a.id - b.id);
  const allIds = sorted.map(t => t.id);
  if (sorted.length === 1) {
    return { tableNumber: sorted[0].id, allTableIds: allIds };
  }
  return {
    tableNumber: sorted[0].id,
    allTableIds: allIds,
    combinedNote: `[Mesas combinadas: ${sorted.map(t => t.id).join(', ')}]`,
  };
}

/**
 * Core assignment logic (no DB access).
 * Given occupied IDs, find the best table(s) for a reservation.
 */
export function assignTablePure(
  guests: number,
  preference: string,
  hasPet: boolean,
  occupiedIds: Set<number>
): { tableNumber: number; combinedNote?: string; allTableIds: number[] } | undefined {
  const candidateAreas = getAreasForPreference(preference, hasPet);

  for (const areaId of candidateAreas) {
    const fit = findBestFitInArea(areaId, guests, occupiedIds);
    if (fit) {
      return buildResult(fit);
    }
  }

  return undefined;
}
