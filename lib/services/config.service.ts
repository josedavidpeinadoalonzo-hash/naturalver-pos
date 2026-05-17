import { CompanyConfig } from '../models';
import { storageService } from './storage.service';

class ConfigService {
  async getConfig(): Promise<CompanyConfig | null> {
    return await storageService.getCompanyConfig();
  }

  async saveConfig(config: CompanyConfig): Promise<void> {
    await storageService.saveCompanyConfig(config);
  }

  async updateConfig(data: Partial<CompanyConfig>): Promise<CompanyConfig> {
    const current = await this.getConfig() || { name: '', rif: '' };
    const updated = { ...current, ...data };
    await this.saveConfig(updated);
    return updated;
  }
}

export const configService = new ConfigService();
