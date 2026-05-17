import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BCV_STORAGE_KEY = 'naturalver_bcv_rate';

export interface ExchangeRate {
  rate: number;
  date: string;
  fetchedAt: number;
}

class BcvService {
  private cache: ExchangeRate | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hora

  /**
   * Obtiene la tasa oficial del BCV.
   * Se actualiza automáticamente cada 1 hora.
   * Persiste la tasa en almacenamiento local.
   */
  async getLatestRate(): Promise<number> {
    const now = Date.now();

    // 1. Si hay caché en memoria y tiene menos de 1 hora, usarla
    if (this.cache && (now - this.cache.fetchedAt < this.CACHE_DURATION)) {
      return this.cache.rate;
    }

    // 2. Revisar almacenamiento persistente
    const stored = await this.getStoredRate();
    if (stored && (now - stored.fetchedAt < this.CACHE_DURATION)) {
      this.cache = stored;
      return stored.rate;
    }

    // 3. El caché expiró → buscar nueva tasa
    try {
      const response = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', {
        timeout: 10000,
      });
      const rate = response.data.promedio || response.data.valor;

      if (rate && rate > 0) {
        const newRate: ExchangeRate = {
          rate,
          date: new Date().toISOString().split('T')[0],
          fetchedAt: Date.now(),
        };

        this.cache = newRate;
        await this.storeRate(newRate);
        console.log(`[BCV] Tasa actualizada: ${rate} Bs/$ (${newRate.date})`);
        return rate;
      }
    } catch (error) {
      console.error('[BCV] Error al obtener tasa:', error);
    }

    // 4. Fallback: usar tasa anterior guardada
    if (stored && stored.rate > 0) {
      console.log(`[BCV] Usando tasa guardada: ${stored.rate} Bs/$`);
      this.cache = stored;
      return stored.rate;
    }

    // 5. Último recurso
    console.warn('[BCV] Usando tasa de respaldo');
    return 36.50;
  }

  /**
   * Fuerza la actualización de la tasa
   */
  async forceRefresh(): Promise<number> {
    this.cache = null;
    await AsyncStorage.removeItem(BCV_STORAGE_KEY);
    return this.getLatestRate();
  }

  /**
   * Obtiene la información completa de la tasa actual
   */
  async getRateInfo(): Promise<ExchangeRate | null> {
    await this.getLatestRate();
    return this.cache;
  }

  /**
   * Convierte USD a BS usando la tasa actual
   */
  async convertToBs(amountUsd: number): Promise<number> {
    const rate = await this.getLatestRate();
    return Number((amountUsd * rate).toFixed(2));
  }

  /**
   * Convierte BS a USD usando la tasa actual
   */
  async convertToUsd(amountBs: number): Promise<number> {
    const rate = await this.getLatestRate();
    return Number((amountBs / rate).toFixed(2));
  }

  // === Almacenamiento Persistente ===

  private async storeRate(rate: ExchangeRate): Promise<void> {
    try {
      await AsyncStorage.setItem(BCV_STORAGE_KEY, JSON.stringify(rate));
    } catch (error) {
      console.error('[BCV] Error guardando tasa:', error);
    }
  }

  private async getStoredRate(): Promise<ExchangeRate | null> {
    try {
      const data = await AsyncStorage.getItem(BCV_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[BCV] Error leyendo tasa guardada:', error);
      return null;
    }
  }
}

export const bcvService = new BcvService();
