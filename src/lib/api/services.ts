import { SMMCOSTClient } from '@/lib/api/smmcost';
import { SMMCategory, SMMService } from '@/types';
import { PrismaClient } from '@prisma/client';
import { calculatePriceWithMarkup } from '@/lib/utils';

const prisma = new PrismaClient();
const smmcostClient = new SMMCOSTClient();

// Default markup percentage
const DEFAULT_MARKUP_PERCENTAGE = 30;

/**
 * Sync all services from SMMCOST API
 */
export async function syncServices() {
  try {
    // Get all services from SMMCOST API
    const services = await smmcostClient.getServices();
    
    // Get current markup setting from database or use default
    const markupSetting = await prisma.setting.findUnique({
      where: { key: 'default_markup' },
    });
    
    const markupPercentage = markupSetting 
      ? parseFloat(markupSetting.value) 
      : DEFAULT_MARKUP_PERCENTAGE;
    
    // Process and categorize services
    const categories = new Map<string, SMMService[]>();
    
    for (const service of services) {
      const category = service.category;
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      const originalRate = parseFloat(service.rate);
      const rate = calculatePriceWithMarkup(originalRate, markupPercentage);
      
      const smmService: SMMService = {
        service: service.service,
        name: service.name,
        category: service.category,
        type: service.type,
        rate: rate,
        originalRate: originalRate,
        min: parseInt(service.min),
        max: parseInt(service.max),
        dripfeed: service.dripfeed,
        refill: service.refill,
      };
      
      categories.get(category)?.push(smmService);
    }
    
    // Save categories to database
    for (const [categoryName, services] of categories.entries()) {
      // Create or update category
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: { updatedAt: new Date() },
        create: { name: categoryName },
      });
      
      // Process services for this category
      for (const service of services) {
        await prisma.service.upsert({
          where: { serviceId: service.service },
          update: {
            name: service.name,
            category: service.category,
            type: service.type,
            rate: service.rate,
            originalRate: service.originalRate,
            min: service.min,
            max: service.max,
            dripfeed: service.dripfeed,
            refill: service.refill,
            updatedAt: new Date(),
          },
          create: {
            serviceId: service.service,
            name: service.name,
            category: service.category,
            type: service.type,
            rate: service.rate,
            originalRate: service.originalRate,
            min: service.min,
            max: service.max,
            dripfeed: service.dripfeed,
            refill: service.refill,
          },
        });
      }
    }
    
    return { success: true, message: 'Services synced successfully' };
  } catch (error) {
    console.error('Error syncing services:', error);
    return { success: false, message: 'Failed to sync services' };
  }
}

/**
 * Get all categories with their services
 */
export async function getAllCategories(): Promise<SMMCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    
    const result: SMMCategory[] = [];
    
    for (const category of categories) {
      const services = await prisma.service.findMany({
        where: { category: category.name },
        orderBy: { name: 'asc' },
      });
      
      result.push({
        id: category.id,
        name: category.name,
        services: services.map(s => ({
          service: s.serviceId,
          name: s.name,
          category: s.category,
          type: s.type,
          rate: s.rate,
          originalRate: s.originalRate,
          min: s.min,
          max: s.max,
          dripfeed: s.dripfeed,
          refill: s.refill,
          description: s.description || undefined,
        })),
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

/**
 * Get a service by ID
 */
export async function getServiceById(serviceId: number) {
  try {
    const service = await prisma.service.findUnique({
      where: { serviceId },
    });
    
    if (!service) {
      return null;
    }
    
    return {
      service: service.serviceId,
      name: service.name,
      category: service.category,
      type: service.type,
      rate: service.rate,
      originalRate: service.originalRate,
      min: service.min,
      max: service.max,
      dripfeed: service.dripfeed,
      refill: service.refill,
      description: service.description || undefined,
    };
  } catch (error) {
    console.error('Error getting service:', error);
    return null;
  }
}

/**
 * Update service markup
 */
export async function updateServiceMarkup(markupPercentage: number) {
  try {
    // Update the markup setting
    await prisma.setting.upsert({
      where: { key: 'default_markup' },
      update: { value: markupPercentage.toString() },
      create: { key: 'default_markup', value: markupPercentage.toString() },
    });
    
    // Get all services
    const services = await prisma.service.findMany();
    
    // Update each service with the new markup
    for (const service of services) {
      const newRate = calculatePriceWithMarkup(service.originalRate, markupPercentage);
      
      await prisma.service.update({
        where: { id: service.id },
        data: { rate: newRate },
      });
    }
    
    return { success: true, message: 'Markup updated successfully' };
  } catch (error) {
    console.error('Error updating markup:', error);
    return { success: false, message: 'Failed to update markup' };
  }
}

/**
 * Update service description
 */
export async function updateServiceDescription(serviceId: number, description: string) {
  try {
    await prisma.service.update({
      where: { serviceId },
      data: { description },
    });
    
    return { success: true, message: 'Description updated successfully' };
  } catch (error) {
    console.error('Error updating description:', error);
    return { success: false, message: 'Failed to update description' };
  }
}
