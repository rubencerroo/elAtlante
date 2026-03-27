import { describe, it, expect } from 'vitest';
import { RESTAURANT_BASE_DATA, getBreadcrumbList, getMenuData, getOrganizationData, getWebSiteData, getLocalBusinessData } from './seoStructuredData';

describe('SEO Structured Data Utility', () => {
  it('should have correct base restaurant data', () => {
    expect(RESTAURANT_BASE_DATA['@type']).toBe('Restaurant');
    expect(RESTAURANT_BASE_DATA.name).toBe('El Atlante de San Cristóbal');
    expect(RESTAURANT_BASE_DATA.address.streetAddress).toContain('Calle Marina');
    expect(RESTAURANT_BASE_DATA.potentialAction['@type']).toBe('ReserveAction');
  });

  it('should generate valid BreadcrumbList', () => {
    const items = [
      { name: 'Home', url: '/' },
      { name: 'Menu', url: '/carta' }
    ];
    const breadcrumbs = getBreadcrumbList(items);
    
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement).toHaveLength(2);
    expect(breadcrumbs.itemListElement[1].name).toBe('Menu');
    expect(breadcrumbs.itemListElement[1].item).toBe('https://elatlantedesancristobal.com/carta');
  });

  it('should generate valid Menu data', () => {
    const menuEs = getMenuData('es');
    expect(menuEs['@type']).toBe('Menu');
    expect(menuEs.url).toContain('carta_es.pdf');
    
    const menuEn = getMenuData('en');
    expect(menuEn.url).toContain('carta_en.pdf');
    expect(menuEn.name).toBe('Menu - El Atlante');
  });

  it('should generate valid Organization data', () => {
    const org = getOrganizationData();
    expect(org['@type']).toBe('Organization');
    expect(org.logo).toContain('logoblack.png');
    expect(org.sameAs).toHaveLength(2);
  });

  it('should generate valid WebSite data', () => {
    const ws = getWebSiteData();
    expect(ws['@type']).toBe('WebSite');
    expect(ws.name).toBe('El Atlante de San Cristóbal');
  });

  it('should generate valid LocalBusiness data', () => {
    const lb = getLocalBusinessData();
    expect(lb['@type']).toBe('LocalBusiness');
    expect(lb.telephone).toBeDefined();
  });
});
