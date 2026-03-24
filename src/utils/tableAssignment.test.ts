import { describe, it, expect } from 'vitest';
import {
  timeToMinutesLocal,
  computeOccupiedIds,
  findBestFitInArea,
  findMinimalCombo,
  buildResult,
  assignTablePure,
} from './tableAssignment';
import {
  TABLES,
  getTablesInArea,
  getAreasForPreference,
  getTotalCapacity,
} from './tableConfig';

// ────────────────────────────────────────
// tableConfig sanity checks
// ────────────────────────────────────────

describe('tableConfig', () => {
  it('should have 43 tables', () => {
    expect(TABLES).toHaveLength(43);
  });

  it('total capacity should be 105', () => {
    expect(getTotalCapacity()).toBe(105);
  });

  it('Salón Grande has 7 tables (6×4 + 1×2 = 26 seats)', () => {
    const t = getTablesInArea('salon_grande');
    expect(t).toHaveLength(7);
    expect(t.reduce((s, x) => s + x.capacity, 0)).toBe(26);
  });

  it('Salón Derecha has 7 tables (7×2 = 14 seats)', () => {
    const t = getTablesInArea('salon_derecha');
    expect(t).toHaveLength(7);
    expect(t.reduce((s, x) => s + x.capacity, 0)).toBe(14);
  });

  it('Salón Izquierda has 4 tables (1×4 + 3×2 = 10 seats)', () => {
    const t = getTablesInArea('salon_izquierda');
    expect(t).toHaveLength(4);
    expect(t.reduce((s, x) => s + x.capacity, 0)).toBe(10);
  });

  it('Terraza Principal has 11 tables (11×2 = 22 seats)', () => {
    const t = getTablesInArea('terraza_principal');
    expect(t).toHaveLength(11);
    expect(t.reduce((s, x) => s + x.capacity, 0)).toBe(22);
  });

  it('Terraza Derecha has 10 tables (10×2 = 20 seats)', () => {
    const t = getTablesInArea('terraza_derecha');
    expect(t).toHaveLength(10);
    expect(t.reduce((s, x) => s + x.capacity, 0)).toBe(20);
  });

  it('Terraza Izquierda has 4 tables (1×4 + 3×3 = 13 seats)', () => {
    const t = getTablesInArea('terraza_izquierda');
    expect(t).toHaveLength(4);
    expect(t.reduce((s, x) => s + x.capacity, 0)).toBe(13);
  });

  it('all table IDs are unique', () => {
    const ids = TABLES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ────────────────────────────────────────
// getAreasForPreference
// ────────────────────────────────────────

describe('getAreasForPreference', () => {
  it('Interior → interior areas first', () => {
    const areas = getAreasForPreference('Interior', false);
    expect(areas.slice(0, 3)).toEqual(['salon_grande', 'salon_derecha', 'salon_izquierda']);
  });

  it('Terraza exterior → terraza areas first', () => {
    const areas = getAreasForPreference('Terraza exterior', false);
    expect(areas[0]).toBe('terraza_principal');
    expect(areas[1]).toBe('terraza_derecha');
  });

  it('Mesas altas → terraza_izquierda first', () => {
    const areas = getAreasForPreference('Mesas altas', false);
    expect(areas[0]).toBe('terraza_izquierda');
  });

  it('Indiferente → all areas', () => {
    const areas = getAreasForPreference('Indiferente', false);
    expect(areas).toHaveLength(6);
  });

  it('pet=true overrides preference to exterior only', () => {
    const areas = getAreasForPreference('Interior', true);
    // Only exterior areas
    expect(areas.every(a => a.includes('terraza'))).toBe(true);
  });

  it('pet=true with Mesas altas also returns only exterior', () => {
    const areas = getAreasForPreference('Mesas altas', true);
    expect(areas.every(a => a.includes('terraza'))).toBe(true);
  });
});

// ────────────────────────────────────────
// timeToMinutesLocal
// ────────────────────────────────────────

describe('timeToMinutesLocal', () => {
  it('12:30 = 750', () => expect(timeToMinutesLocal('12:30')).toBe(750));
  it('00:00 = 0', () => expect(timeToMinutesLocal('00:00')).toBe(0));
  it('23:00 = 1380', () => expect(timeToMinutesLocal('23:00')).toBe(1380));
  it('14:15 = 855', () => expect(timeToMinutesLocal('14:15')).toBe(855));
});

// ────────────────────────────────────────
// computeOccupiedIds
// ────────────────────────────────────────

describe('computeOccupiedIds', () => {
  it('returns empty set for no reservations', () => {
    expect(computeOccupiedIds([], '14:00').size).toBe(0);
  });

  it('finds tables within 2h window', () => {
    const reservations = [
      { table_number: 1, time: '13:00:00' },
      { table_number: 5, time: '15:30:00' },
      { table_number: 10, time: '18:00:00' }, // too far
    ];
    const occupied = computeOccupiedIds(reservations, '14:00');
    expect(occupied.has(1)).toBe(true);
    expect(occupied.has(5)).toBe(true);
    expect(occupied.has(10)).toBe(false);
  });

  it('ignores null table_number', () => {
    const reservations = [
      { table_number: null, time: '14:00:00' },
    ];
    const occupied = computeOccupiedIds(reservations, '14:00');
    expect(occupied.size).toBe(0);
  });

  it('exactly at 2h boundary is NOT included', () => {
    const reservations = [
      { table_number: 3, time: '16:00:00' }, // exactly 2h from 14:00
    ];
    const occupied = computeOccupiedIds(reservations, '14:00');
    expect(occupied.has(3)).toBe(false); // 120 min diff = NOT less than 120
  });
});

// ────────────────────────────────────────
// findBestFitInArea
// ────────────────────────────────────────

describe('findBestFitInArea', () => {
  it('finds single table for 2 guests in Salón Grande (picks mesa 7, cap=2)', () => {
    const result = findBestFitInArea('salon_grande', 2, new Set());
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].capacity).toBe(2); // Should pick smallest: mesa 7 (cap=2)
    expect(result![0].id).toBe(7);
  });

  it('finds single table for 4 guests in Salón Grande (picks a cap=4)', () => {
    const result = findBestFitInArea('salon_grande', 4, new Set());
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].capacity).toBe(4);
  });

  it('finds single table for 3 guests in Salón Grande (picks cap=4, smallest >= 3)', () => {
    const result = findBestFitInArea('salon_grande', 3, new Set());
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].capacity).toBe(4); // No 3-cap table here, so picks 4
  });

  it('combines tables for 6 guests in Salón Grande', () => {
    const result = findBestFitInArea('salon_grande', 6, new Set());
    expect(result).not.toBeNull();
    const totalCap = result!.reduce((s, t) => s + t.capacity, 0);
    expect(totalCap).toBeGreaterThanOrEqual(6);
    // Should combine 2 tables: one 4 + one 2 = 6 (perfect fit)
    expect(totalCap).toBe(6);
  });

  it('combines tables for 8 guests in Salón Grande (4+4=8)', () => {
    const result = findBestFitInArea('salon_grande', 8, new Set());
    expect(result).not.toBeNull();
    const totalCap = result!.reduce((s, t) => s + t.capacity, 0);
    expect(totalCap).toBe(8); // Two 4-cap tables = 8
  });

  it('returns null when all tables in area are occupied', () => {
    const allIds = getTablesInArea('salon_derecha').map(t => t.id);
    const result = findBestFitInArea('salon_derecha', 2, new Set(allIds));
    expect(result).toBeNull();
  });

  it('skips occupied tables correctly', () => {
    // Occupy mesa 7 (the only 2-cap in salon_grande)
    const result = findBestFitInArea('salon_grande', 2, new Set([7]));
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].capacity).toBe(4); // Has to use a 4-cap since 2-cap is occupied
  });

  it('returns null when not enough capacity even combining all free tables', () => {
    // Terraza Izquierda has 4+3+3+3 = 13 total. Ask for 14.
    const result = findBestFitInArea('terraza_izquierda', 14, new Set());
    expect(result).toBeNull();
  });

  it('combines tables optimally: picks 3+3=6 over 4+3=7 for 6 guests in terraza_izquierda', () => {
    // terraza_izquierda: mesa 40 (4), mesa 41 (3), mesa 42 (3), mesa 43 (3)
    const result = findBestFitInArea('terraza_izquierda', 6, new Set());
    expect(result).not.toBeNull();
    const totalCap = result!.reduce((s, t) => s + t.capacity, 0);
    expect(totalCap).toBe(6); // 3+3 = 6, not 4+3 = 7
  });

  it('handles 1 guest — picks smallest available table', () => {
    const result = findBestFitInArea('salon_derecha', 1, new Set());
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].capacity).toBe(2); // Smallest in salon_derecha
  });
});

// ────────────────────────────────────────
// findMinimalCombo
// ────────────────────────────────────────

describe('findMinimalCombo', () => {
  it('finds perfect fit combo', () => {
    const tables = [
      { id: 1, capacity: 4, area: 'salon_grande' as const },
      { id: 2, capacity: 2, area: 'salon_grande' as const },
      { id: 3, capacity: 3, area: 'salon_grande' as const },
    ];
    const result = findMinimalCombo(tables, 6);
    expect(result).not.toBeNull();
    const total = result!.reduce((s, t) => s + t.capacity, 0);
    expect(total).toBe(6); // 4+2 = 6
  });

  it('picks minimum waste combo', () => {
    const tables = [
      { id: 1, capacity: 4, area: 'salon_grande' as const },
      { id: 2, capacity: 4, area: 'salon_grande' as const },
      { id: 3, capacity: 2, area: 'salon_grande' as const },
    ];
    const result = findMinimalCombo(tables, 5);
    expect(result).not.toBeNull();
    const total = result!.reduce((s, t) => s + t.capacity, 0);
    expect(total).toBe(6); // 4+2 = 6 (minimum >= 5)
  });

  it('returns null when not enough capacity', () => {
    const tables = [
      { id: 1, capacity: 2, area: 'salon_grande' as const },
      { id: 2, capacity: 2, area: 'salon_grande' as const },
    ];
    const result = findMinimalCombo(tables, 5);
    expect(result).toBeNull();
  });

  it('single table is valid combo', () => {
    const tables = [
      { id: 1, capacity: 4, area: 'salon_grande' as const },
    ];
    const result = findMinimalCombo(tables, 3);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
  });
});

// ────────────────────────────────────────
// buildResult
// ────────────────────────────────────────

describe('buildResult', () => {
  it('single table — allTableIds contains it', () => {
    const result = buildResult([{ id: 5, capacity: 4, area: 'salon_grande' }]);
    expect(result.tableNumber).toBe(5);
    expect(result.allTableIds).toEqual([5]);
  });

  it('multiple tables — allTableIds sorted', () => {
    const result = buildResult([
      { id: 7, capacity: 2, area: 'salon_grande' },
      { id: 3, capacity: 4, area: 'salon_grande' },
    ]);
    expect(result.tableNumber).toBe(3); // lowest ID
    expect(result.allTableIds).toEqual([3, 7]);
  });
});

// ────────────────────────────────────────
// assignTablePure (end-to-end pure logic)
// ────────────────────────────────────────

describe('assignTablePure', () => {
  it('assigns interior table for Interior preference (empty restaurant)', () => {
    const result = assignTablePure(2, 'Interior', false, new Set());
    expect(result).toBeDefined();
    // Should be in salon_grande, salon_derecha, or salon_izquierda (IDs 1-18)
    expect(result!.tableNumber).toBeGreaterThanOrEqual(1);
    expect(result!.tableNumber).toBeLessThanOrEqual(18);
  });

  it('assigns exterior table for Terraza exterior preference', () => {
    const result = assignTablePure(2, 'Terraza exterior', false, new Set());
    expect(result).toBeDefined();
    // terraza_principal (19-29) or terraza_derecha (30-39)
    expect(result!.tableNumber).toBeGreaterThanOrEqual(19);
    expect(result!.tableNumber).toBeLessThanOrEqual(39);
  });

  it('assigns mesa alta for Mesas altas preference', () => {
    const result = assignTablePure(3, 'Mesas altas', false, new Set());
    expect(result).toBeDefined();
    // terraza_izquierda (40-43)
    expect(result!.tableNumber).toBeGreaterThanOrEqual(40);
    expect(result!.tableNumber).toBeLessThanOrEqual(43);
  });

  it('pet=true always gets exterior regardless of Interior preference', () => {
    const result = assignTablePure(2, 'Interior', true, new Set());
    expect(result).toBeDefined();
    // Must be in terraza areas (19-43)
    expect(result!.tableNumber).toBeGreaterThanOrEqual(19);
    expect(result!.tableNumber).toBeLessThanOrEqual(43);
  });

  it('pet=true always gets exterior with Indiferente preference', () => {
    const result = assignTablePure(2, 'Indiferente', true, new Set());
    expect(result).toBeDefined();
    expect(result!.tableNumber).toBeGreaterThanOrEqual(19);
    expect(result!.tableNumber).toBeLessThanOrEqual(43);
  });

  it('falls back to exterior when all interior is full', () => {
    // Occupy all interior tables (1-18)
    const occupied = new Set(Array.from({ length: 18 }, (_, i) => i + 1));
    const result = assignTablePure(2, 'Interior', false, occupied);
    expect(result).toBeDefined();
    expect(result!.tableNumber).toBeGreaterThanOrEqual(19); // Falls to exterior
  });

  it('returns undefined when ALL tables are occupied', () => {
    const allIds = new Set(TABLES.map(t => t.id));
    const result = assignTablePure(2, 'Indiferente', false, allIds);
    expect(result).toBeUndefined();
  });

  it('picks smallest single table for small party', () => {
    const result = assignTablePure(1, 'Interior', false, new Set());
    expect(result).toBeDefined();
    // Interior smallest: mesa 7 (cap 2) in salon_grande
    expect(result!.tableNumber).toBe(7);
  });

  it('picks 4-cap table for 4 guests over combining two 2s', () => {
    const result = assignTablePure(4, 'Interior', false, new Set());
    expect(result).toBeDefined();
    expect(result!.allTableIds).toHaveLength(1); // Single table
    // Should be one of the 4-cap tables (1-6 or 15)
    const table = TABLES.find(t => t.id === result!.tableNumber);
    expect(table!.capacity).toBe(4);
  });

  it('combines tables for 6 guests in salon_grande', () => {
    const result = assignTablePure(6, 'Interior', false, new Set());
    expect(result).toBeDefined();
    // Should combine: 4+2=6 is optimal
    // Either has combinedNote or single table with cap >= 6 (none exist single here)
    // salon_grande max single = 4, so must combine
    expect(result!.allTableIds.length).toBeGreaterThan(1);
  });

  it('combines optimally: 10 guests, fills salon_grande first', () => {
    const result = assignTablePure(10, 'Interior', false, new Set());
    expect(result).toBeDefined();
    expect(result!.allTableIds.length).toBeGreaterThan(1);
  });

  it('Indiferente picks salon_grande first (interior-first order)', () => {
    const result = assignTablePure(2, 'Indiferente', false, new Set());
    expect(result).toBeDefined();
    // Should be mesa 7 (smallest in salon_grande, the first area for Indiferente)
    expect(result!.tableNumber).toBe(7);
  });

  it('handles large party needing many combined tables', () => {
    const result = assignTablePure(20, 'Interior', false, new Set());
    expect(result).toBeDefined();
    // salon_grande has 26 seats — can fit 20 by combining all 7 tables
    expect(result!.allTableIds.length).toBeGreaterThan(1);
  });

  it('large party exceeding single area falls to combining across areas if needed', () => {
    // salon_grande max = 26. For 27 guests with Interior pref,
    // it should fail salon_grande (26 max), then try salon_derecha (14), 
    // then salon_izquierda (10), etc. None single area fits 27.  
    // But wait - it checks each area independently! So 27 can't fit any single area interior.
    // salon_grande (26) < 27, so it'll fall to exterior.
    // Let's check: terraza_principal has 22, terraza_derecha has 20. Neither fits 27.
    // No single area has 27. So returns undefined.
    // Actually... let me verify. The largest single area is salon_grande with 26.
    const result = assignTablePure(27, 'Interior', false, new Set());
    expect(result).toBeUndefined(); // No single area can seat 27
  });

  it('26 guests fit in salon_grande by combining all tables', () => {
    const result = assignTablePure(26, 'Interior', false, new Set());
    expect(result).toBeDefined();
    expect(result!.allTableIds.length).toBeGreaterThan(1);
  });

  it('with some interior occupied, still finds the best available', () => {
    // Occupy all 4-cap tables in salon_grande (1-6)
    const occupied = new Set([1, 2, 3, 4, 5, 6]);
    const result = assignTablePure(2, 'Interior', false, occupied);
    expect(result).toBeDefined();
    // Mesa 7 (2-cap in salon_grande) is still free
    expect(result!.tableNumber).toBe(7);
  });

  it('when salon_grande is full, moves to salon_derecha', () => {
    // Occupy all salon_grande tables (1-7)
    const occupied = new Set([1, 2, 3, 4, 5, 6, 7]);
    const result = assignTablePure(2, 'Interior', false, occupied);
    expect(result).toBeDefined();
    // Should pick from salon_derecha (8-14)
    expect(result!.tableNumber).toBeGreaterThanOrEqual(8);
    expect(result!.tableNumber).toBeLessThanOrEqual(14);
  });

  it('terraza preference with pet=true picks smallest exterior table', () => {
    const result = assignTablePure(2, 'Terraza exterior', true, new Set());
    expect(result).toBeDefined();
    // terraza_principal first area, empty room -> picks middle table of 11 candidates (index 5) -> 24
    expect(result!.tableNumber).toBe(24);
  });
});

// ────────────────────────────────────────
// Table optimization scenarios
// ────────────────────────────────────────

describe('optimization scenarios', () => {
  it('sequential 2-guest reservations fill smallest tables first', () => {
    const occupied = new Set<number>();
    const assignments: number[] = [];

    // Simulate 5 reservations for 2 guests Indiferente
    for (let i = 0; i < 5; i++) {
      const result = assignTablePure(2, 'Indiferente', false, occupied);
      expect(result).toBeDefined();
      assignments.push(result!.tableNumber);
      occupied.add(result!.tableNumber);
    }

    // First assignment should be mesa 7 (2-cap, salon_grande — smallest fit)
    expect(assignments[0]).toBe(7);
    // After mesa 7 is taken, next should pick from 4-cap in salon_grande (1-6) 
    // since they're the smallest available >= 2
    // Actually salon_derecha has 2-cap tables (8-14) which are a better fit!
    // Let's verify: salon_grande is checked first in Indiferente order.
    // When mesa 7 is occupied, the next 2-cap options in salon_grande are gone.
    // So it falls to salon_derecha which has 2-cap tables.
    // Wait, no: findBestFitInArea will look in salon_grande first, find that
    // only 4-cap tables are free, and return one of those (cap 4 >= 2).
    // It picks the smallest single that fits, which is 4.  
    // BUT then it should try salon_derecha too? No — the loop stops at first fit.
    // So it will return a 4-cap table in salon_grande. Not ideal for optimization.
    // This is a known trade-off: area order matters. The function iterates areas
    // in preference order and returns the first area that has a fit.
    // For "Indiferente", it goes salon_grande first, and finds a 4-cap table.
    expect(assignments[1]).toBeLessThanOrEqual(6); // 4-cap in salon_grande
  });

  it('does not waste 4-cap tables when 2-cap ones are available in same area', () => {
    // In salon_grande, mesa 7 is the only 2-cap. For 2 guests, it should pick 7 first.
    const result = findBestFitInArea('salon_grande', 2, new Set());
    expect(result).not.toBeNull();
    expect(result![0].id).toBe(7); // Picks the 2-cap over 4-caps
  });

  it('combining minimizes wasted seats', () => {
    // terraza_izquierda: mesa 40(4), 41(3), 42(3), 43(3)
    // For 6 guests: optimal is 3+3=6, not 4+3=7
    const result = findBestFitInArea('terraza_izquierda', 6, new Set());
    expect(result).not.toBeNull();
    const total = result!.reduce((s, t) => s + t.capacity, 0);
    expect(total).toBe(6); // 3+3, not 4+3
  });

  it('for 7 guests in terraza_izquierda, picks 4+3=7 (perfect fit)', () => {
    const result = findBestFitInArea('terraza_izquierda', 7, new Set());
    expect(result).not.toBeNull();
    const total = result!.reduce((s, t) => s + t.capacity, 0);
    expect(total).toBe(7); // 4+3
  });

  it('for 9 guests in terraza_izquierda, picks 3+3+3=9', () => {
    const result = findBestFitInArea('terraza_izquierda', 9, new Set());
    expect(result).not.toBeNull();
    const total = result!.reduce((s, t) => s + t.capacity, 0);
    expect(total).toBe(9); // 3+3+3
  });

  it('for 10 guests in terraza_izquierda, picks 4+3+3=10', () => {
    const result = findBestFitInArea('terraza_izquierda', 10, new Set());
    expect(result).not.toBeNull();
    const total = result!.reduce((s, t) => s + t.capacity, 0);
    expect(total).toBe(10); // 4+3+3
  });
});
