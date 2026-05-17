import { Linking } from 'react-native';
import { Product, ProductPresentation, Sale } from '@/lib/models';

class ReceiptService {
  /**
   * Genera un recibo en texto formateado para enviar por WhatsApp
   */
  generateReceipt(
    sale: Sale,
    product: Product,
    presentation: ProductPresentation,
    businessName: string = "NaturalVer's"
  ): string {
    const date = new Date(sale.createdAt);
    const dateStr = date.toLocaleDateString('es-VE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const paymentLabel = sale.paymentType === 'cash'
      ? '💵 Efectivo ($)'
      : sale.paymentType === 'mobile'
        ? '📱 Pago Móvil'
        : '🔄 Mixto';

    let receipt = `━━━━━━━━━━━━━━━━━━━━\n`;
    receipt += `🏪 *${businessName}*\n`;
    receipt += `━━━━━━━━━━━━━━━━━━━━\n`;
    receipt += `📅 ${dateStr} - ${timeStr}\n`;
    receipt += `📋 Recibo: #${sale.id.slice(-6).toUpperCase()}\n`;
    receipt += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    receipt += `📦 *Producto:* ${product.name}\n`;
    receipt += `📏 *Presentación:* ${presentation.name}\n`;
    receipt += `🔢 *Cantidad:* ${sale.quantity}\n`;
    receipt += `💲 *Precio USD:* $${presentation.priceUSD.toFixed(2)}\n`;
    if (presentation.priceBs > 0) {
      receipt += `🇻🇪 *Precio Bs:* ${presentation.priceBs.toFixed(2)} Bs\n`;
    }
    receipt += `\n`;

    if (sale.isWholesale && sale.wholesaleDiscount) {
      const subtotal = presentation.priceUSD * sale.quantity;
      receipt += `📊 Subtotal: $${subtotal.toFixed(2)}\n`;
      receipt += `🏷️ Descuento Mayor: -${sale.wholesaleDiscount}%\n`;
    }

    receipt += `━━━━━━━━━━━━━━━━━━━━\n`;
    receipt += `💰 *TOTAL: $${sale.totalAmountUSD.toFixed(2)}*\n`;
    receipt += `💰 *TOTAL: ${sale.totalAmountBS.toFixed(2)} Bs*\n`;
    receipt += `━━━━━━━━━━━━━━━━━━━━\n`;
    receipt += `📊 Tasa BCV: ${sale.exchangeRate.toFixed(2)} Bs/$\n`;
    receipt += `💳 Pago: ${paymentLabel}\n`;

    if (sale.paymentType === 'mobile' || sale.paymentType === 'mixed') {
      receipt += `📱 Monto Móvil: ${(sale.mobileAmountBS || 0).toFixed(2)} Bs\n`;
    }
    if (sale.paymentType === 'cash' || sale.paymentType === 'mixed') {
      receipt += `💵 Monto Efectivo: $${(sale.cashAmountUSD || 0).toFixed(2)}\n`;
    }

    if (sale.customerName) {
      receipt += `\n👤 Cliente: ${sale.customerName}\n`;
    }

    receipt += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    receipt += `✅ *¡Gracias por su compra!*\n`;
    receipt += `🏪 ${businessName}\n`;
    receipt += `━━━━━━━━━━━━━━━━━━━━`;

    return receipt;
  }

  /**
   * Envía un recibo por WhatsApp
   */
  async sendViaWhatsApp(
    receipt: string,
    phoneNumber?: string
  ): Promise<void> {
    const encodedMessage = encodeURIComponent(receipt);

    let whatsappUrl: string;

    if (phoneNumber) {
      // Limpiar el número de teléfono
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      // Si no tiene código de país, agregar +58 (Venezuela)
      const fullPhone = cleanPhone.length <= 10 ? `58${cleanPhone}` : cleanPhone;
      whatsappUrl = `whatsapp://send?phone=${fullPhone}&text=${encodedMessage}`;
    } else {
      // Abrir WhatsApp para elegir contacto
      whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback a compartir genérico
        await Linking.openURL(`https://wa.me/?text=${encodedMessage}`);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      throw new Error('No se pudo abrir WhatsApp');
    }
  }

  /**
   * Genera y envía un recibo completo
   */
  async sendReceipt(
    sale: Sale,
    product: Product,
    presentation: ProductPresentation,
    phoneNumber?: string
  ): Promise<void> {
    const receipt = this.generateReceipt(sale, product, presentation);
    await this.sendViaWhatsApp(receipt, phoneNumber);
  }
}

export const receiptService = new ReceiptService();
