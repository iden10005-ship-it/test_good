import defaultSiteContent from '@/src/data/defaultSiteContent.json';
import siteContent from '@/src/data/siteContent.json';
import type { SiteData } from '@/src/types/clearworks';

export const CLEARWORKS_IMAGES = {
  beforeHero: '/images/hero_before.jpg',
  afterHero: '/images/hero_after.jpg',
  aptBefore: '/images/apt_before.jpg',
  aptAfter: '/images/apt_after.jpg',
  storeBefore: '/images/store_before.jpg',
  storeAfter: '/images/store_after.jpg',
  buildingBefore: '/images/building_before.jpg',
  buildingAfter: '/images/building_after.jpg',
};

export const INITIAL_SITE_DATA: SiteData = siteContent as SiteData;
export const DEFAULT_SITE_DATA: SiteData = defaultSiteContent as SiteData;
