import { MessageTemplate } from '@/lib/models';
import { storageService } from './storage.service';

const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'createdAt'>[] = [
  {
    title: 'Datos de Pago Móvil',
    content: '🌿 *NATURALVER\'S - DATOS DE PAGO*\n\n✅ *Pago Móvil*\n🏦 Banco: [Nombre del Banco]\n🆔 CI: [Cédula]\n📱 Teléfono: [Teléfono]\n\nFavor enviar comprobante al realizar el pago. ¡Gracias! 🙏',
    category: 'payment',
  },
  {
    title: 'Ubicación y Horario',
    content: '📍 *NUESTRA UBICACIÓN*\n[Dirección completa aquí]\n\n⏰ *Horario de Atención*\nLunes a Viernes: 8:00 AM - 5:00 PM\nSábados: 9:00 AM - 1:00 PM\n\n¡Te esperamos! 🌿',
    category: 'location',
  },
  {
    title: 'Agradecimiento de Compra',
    content: '✨ *¡GRACIAS POR TU COMPRA!*\n\nTu pedido de NaturalVer\'s ha sido registrado con éxito. Esperamos que disfrutes de nuestros productos naturales. 🌿\n\nSi tienes alguna duda, estamos a tu orden.',
    category: 'greeting',
  },
];

class TemplatesService {
  async initializeTemplates(): Promise<void> {
    const existing = await storageService.getTemplates();
    if (existing.length === 0) {
      const initial = DEFAULT_TEMPLATES.map((t, index) => ({
        ...t,
        id: `template_${Date.now()}_${index}`,
        createdAt: Date.now(),
      }));
      await storageService.saveTemplates(initial);
    }
  }

  async getTemplates(): Promise<MessageTemplate[]> {
    return storageService.getTemplates();
  }

  async createTemplate(templateData: Omit<MessageTemplate, 'id' | 'createdAt'>): Promise<MessageTemplate> {
    const templates = await storageService.getTemplates();
    const newTemplate: MessageTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    templates.push(newTemplate);
    await storageService.saveTemplates(templates);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    const templates = await storageService.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    const updated = {
      ...templates[index],
      ...updates,
    };
    templates[index] = updated;
    await storageService.saveTemplates(templates);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await storageService.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    if (filtered.length === templates.length) return false;
    await storageService.saveTemplates(filtered);
    return true;
  }
}

export const templatesService = new TemplatesService();
