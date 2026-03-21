/**
 * Static table configuration for El Atlante restaurant.
 * Each table has an ID, capacity, area, and type classification.
 */

export type AreaId =
  | 'salon_grande'
  | 'salon_derecha'
  | 'salon_izquierda'
  | 'terraza_principal'
  | 'terraza_derecha'
  | 'terraza_izquierda';

export type ZoneType = 'interior' | 'exterior' | 'mesas_altas';

export interface TableDef {
  id: number;
  capacity: number; // 2, 3, or 4
  area: AreaId;
}

export interface AreaDef {
  id: AreaId;
  label: string;
  zoneType: ZoneType;
}

// ── Area definitions ──

export const AREAS: AreaDef[] = [
  { id: 'salon_grande',       label: 'Salón Grande',       zoneType: 'interior' },
  { id: 'salon_derecha',      label: 'Salón Derecha',      zoneType: 'interior' },
  { id: 'salon_izquierda',    label: 'Salón Izquierda',    zoneType: 'interior' },
  { id: 'terraza_principal',  label: 'Terraza Principal',  zoneType: 'exterior' },
  { id: 'terraza_derecha',    label: 'Terraza Derecha',    zoneType: 'exterior' },
  { id: 'terraza_izquierda',  label: 'Terraza Izquierda',  zoneType: 'mesas_altas' },
];

// ── All 43 tables ──

export const TABLES: TableDef[] = [
  // Salón Grande: 6x4 + 1x2
  { id: 1,  capacity: 4, area: 'salon_grande' },
  { id: 2,  capacity: 4, area: 'salon_grande' },
  { id: 3,  capacity: 4, area: 'salon_grande' },
  { id: 4,  capacity: 4, area: 'salon_grande' },
  { id: 5,  capacity: 4, area: 'salon_grande' },
  { id: 6,  capacity: 4, area: 'salon_grande' },
  { id: 7,  capacity: 2, area: 'salon_grande' },

  // Salón Derecha: 7x2
  { id: 8,  capacity: 2, area: 'salon_derecha' },
  { id: 9,  capacity: 2, area: 'salon_derecha' },
  { id: 10, capacity: 2, area: 'salon_derecha' },
  { id: 11, capacity: 2, area: 'salon_derecha' },
  { id: 12, capacity: 2, area: 'salon_derecha' },
  { id: 13, capacity: 2, area: 'salon_derecha' },
  { id: 14, capacity: 2, area: 'salon_derecha' },

  // Salón Izquierda: 1x4 + 3x2
  { id: 15, capacity: 4, area: 'salon_izquierda' },
  { id: 16, capacity: 2, area: 'salon_izquierda' },
  { id: 17, capacity: 2, area: 'salon_izquierda' },
  { id: 18, capacity: 2, area: 'salon_izquierda' },

  // Terraza Principal: 11x2
  { id: 19, capacity: 2, area: 'terraza_principal' },
  { id: 20, capacity: 2, area: 'terraza_principal' },
  { id: 21, capacity: 2, area: 'terraza_principal' },
  { id: 22, capacity: 2, area: 'terraza_principal' },
  { id: 23, capacity: 2, area: 'terraza_principal' },
  { id: 24, capacity: 2, area: 'terraza_principal' },
  { id: 25, capacity: 2, area: 'terraza_principal' },
  { id: 26, capacity: 2, area: 'terraza_principal' },
  { id: 27, capacity: 2, area: 'terraza_principal' },
  { id: 28, capacity: 2, area: 'terraza_principal' },
  { id: 29, capacity: 2, area: 'terraza_principal' },

  // Terraza Derecha: 10x2
  { id: 30, capacity: 2, area: 'terraza_derecha' },
  { id: 31, capacity: 2, area: 'terraza_derecha' },
  { id: 32, capacity: 2, area: 'terraza_derecha' },
  { id: 33, capacity: 2, area: 'terraza_derecha' },
  { id: 34, capacity: 2, area: 'terraza_derecha' },
  { id: 35, capacity: 2, area: 'terraza_derecha' },
  { id: 36, capacity: 2, area: 'terraza_derecha' },
  { id: 37, capacity: 2, area: 'terraza_derecha' },
  { id: 38, capacity: 2, area: 'terraza_derecha' },
  { id: 39, capacity: 2, area: 'terraza_derecha' },

  // Terraza Izquierda (Mesas Altas): 1x4 + 3x3
  { id: 40, capacity: 4, area: 'terraza_izquierda' },
  { id: 41, capacity: 3, area: 'terraza_izquierda' },
  { id: 42, capacity: 3, area: 'terraza_izquierda' },
  { id: 43, capacity: 3, area: 'terraza_izquierda' },
];

// ── Helpers ──

export function getAreaDef(areaId: AreaId): AreaDef {
  return AREAS.find(a => a.id === areaId)!;
}

export function getTableDef(tableId: number): TableDef | undefined {
  return TABLES.find(t => t.id === tableId);
}

export function getTablesInArea(areaId: AreaId): TableDef[] {
  return TABLES.filter(t => t.area === areaId);
}

export function getAreasByZone(zone: ZoneType): AreaDef[] {
  return AREAS.filter(a => a.zoneType === zone);
}

/**
 * Maps reservation preference enum to ordered list of candidate areas.
 * First areas are most preferred; rest are fallback.
 */
export function getAreasForPreference(preference: string, hasPet: boolean): AreaId[] {
  // Pets ALWAYS go exterior, regardless of stated preference
  if (hasPet) {
    return [
      'terraza_principal', 'terraza_derecha', 'terraza_izquierda',
    ];
  }

  switch (preference) {
    case 'Interior':
      return [
        'salon_grande', 'salon_derecha', 'salon_izquierda',
        // fallback to exterior
        'terraza_principal', 'terraza_derecha', 'terraza_izquierda',
      ];
    case 'Terraza exterior':
      return [
        'terraza_principal', 'terraza_derecha',
        // fallback
        'terraza_izquierda', 'salon_grande', 'salon_derecha', 'salon_izquierda',
      ];
    case 'Mesas altas':
      return [
        'terraza_izquierda',
        // fallback
        'terraza_principal', 'terraza_derecha', 'salon_grande', 'salon_derecha', 'salon_izquierda',
      ];
    case 'Indiferente':
    default:
      return [
        'salon_grande', 'salon_derecha', 'salon_izquierda',
        'terraza_principal', 'terraza_derecha', 'terraza_izquierda',
      ];
  }
}

/**
 * Total capacity of the restaurant.
 */
export const TOTAL_CAPACITY = TABLES.reduce((sum, t) => sum + t.capacity, 0);
