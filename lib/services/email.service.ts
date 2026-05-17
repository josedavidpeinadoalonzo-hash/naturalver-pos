import * as MailComposer from 'expo-mail-composer';
import { Customer, Sale } from '../models';

class EmailService {
  async sendInvoice(
    pdfUri: string,
    customer: Customer | { email?: string, name?: string },
    sale: Sale
  ): Promise<void> {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('El envío de correos no está disponible en este dispositivo');
    }

    const email = customer.email;
    if (!email) {
      throw new Error('El cliente no tiene un correo electrónico registrado');
    }

    await MailComposer.composeAsync({
      recipients: [email],
      subject: `Factura de Venta #${sale.id.slice(-8).toUpperCase()} - NaturalVer's`,
      body: `Hola ${customer.name || 'Cliente'},\n\nAdjunto encontrarás la factura de tu compra realizada el ${new Date(sale.createdAt).toLocaleDateString('es-VE')}.\n\nGracias por preferirnos.`,
      attachments: [pdfUri],
    });
  }
}

export const emailService = new EmailService();
