/**
 * Dynamic table configuration for El Atlante restaurant.
 * Tables are loaded from the database on startup.
 */
import { supabase } from '../services/supabase';

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

// ── Tables ──

export let TABLES: TableDef[] = [];

export async function loadTables() {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true });

  if (error) {
    console.error('Error loading tables from DB:', error);
    return;
  }

  if (data) {
    TABLES = data.map(d => ({
      id: d.table_number,
      capacity: d.capacity,
      area: d.area as AreaId
    }));
  }
}

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
 * Function now since TABLES is dynamically loaded.
 */
export const getTotalCapacity = () => TABLES.reduce((sum, t) => sum + t.capacity, 0);
