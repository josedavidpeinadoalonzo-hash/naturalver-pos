import { Linking, Alert, Share } from 'react-native';
import { MessageTemplate, Sale, Product, ProductPresentation } from '@/lib/models';

export const useWhatsApp = () => {
  
  const sendMessage = async (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(url);
    } catch (e) {
      // Fallback a Share sheet si no puede abrir whatsapp directo
      Share.share({ message });
    }
  };

  const sendTemplate = async (template: MessageTemplate, phone?: string) => {
    if (phone) {
      await sendMessage(phone, template.content);
    } else {
      const url = `whatsapp://send?text=${encodeURIComponent(template.content)}`;
      Linking.openURL(url).catch(() => Share.share({ message: template.content }));
    }
  };

  const shareCatalog = async (products: Product[], exchangeRate: number) => {
    const catalog = products.map(p => {
      const header = `🟢 *${p.name}*\n`;
      const body = p.presentations.map(pres => 
        `  • ${pres.name}: $${pres.priceUSD.toFixed(2)} (${(pres.priceUSD * exchangeRate).toFixed(2)} Bs)`
      ).join('\n');
      return header + body;
    }).join('\n\n');
    
    const message = `🌿 *CATÁLOGO NATURALVER'S*\n_Tasa: ${exchangeRate.toFixed(2)} Bs_\n\n${catalog}\n\n¡Haz tu pedido! 🚀`;
    
    try {
      await Share.share({ message, title: 'Catálogo NaturalVer\'s' });
    } catch (e) {
      Alert.alert('Error', 'No se pudo compartir el catálogo');
    }
  };

  return {
    sendMessage,
    sendRawMessage: sendMessage,
    sendTemplate,
    shareCatalog
  };
};
