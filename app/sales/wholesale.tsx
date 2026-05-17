import { ScrollView, Text, View, Pressable, TextInput, FlatList, Alert, ActivityIndicator, Share } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Product, ProductPresentation, Sale } from '@/lib/models';
import { salesService } from '@/lib/services/sales.service';
import { receiptService } from '@/lib/services/receipt.service';
import { customerService } from '@/lib/services/customer.service';
import { pdfService } from '@/lib/services/pdf.service';
import { emailService } from '@/lib/services/email.service';
import { configService } from '@/lib/services/config.service';
import { Button, PriceInput, Card } from '@/components/ui';

type PaymentType = 'mobile' | 'cash' | 'mixed' | 'credit';

export default function WholesaleSaleScreen() {
  const { state, recordSale } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation | null>(null);
  const [quantity, setQuantity] = useState('10');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerIdCard, setCustomerIdCard] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [manualDiscount, setManualDiscount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const exchangeRate = state.exchangeRate;
  const discount = parseFloat(manualDiscount.replace(',', '.')) || 0;

  const handleQuantityChange = (delta: number) => {
    if (loading) return;
    const num = Math.max(10, (parseInt(quantity) || 0) + delta);
    setQuantity(num.toString());
  };

  const calculateTotalUSD = () => {
    if (!selectedPresentation) return 0;
    const qty = parseInt(quantity) || 0;
    if (paymentType === 'mobile' && selectedPresentation.priceBs > 0) {
      const subBS = (selectedPresentation.priceBs * qty) * (1 - discount / 100);
      return subBS / exchangeRate;
    }
    return salesService.calculateTotal(selectedPresentation.priceUSD, qty, discount);
  };

  const calculateTotalBS = () => {
    if (!selectedPresentation) return 0;
    const qty = parseInt(quantity) || 0;
    if (selectedPresentation.priceBs > 0) return salesService.calculateTotal(selectedPresentation.priceBs, qty, discount);
    return calculateTotalUSD() * exchangeRate;
  };

  const totalUSD = calculateTotalUSD();
  const totalBS = calculateTotalBS();

  const handleRecordSale = async () => {
    if (!selectedProduct || !selectedPresentation) return Alert.alert('Error', 'Selecciona un producto');
    if (parseInt(quantity) < 10) return Alert.alert('Error', 'Mínimo 10 unidades para venta al mayor');

    try {
      setLoading(true);
      const sale = await recordSale(selectedProduct.id, selectedPresentation.id, parseInt(quantity), paymentType, totalUSD, totalBS, exchangeRate, paymentType === 'mobile' ? totalBS : paymentType === 'mixed' ? totalBS / 2 : 0, paymentType === 'cash' ? totalUSD : paymentType === 'mixed' ? totalUSD / 2 : 0, true, discount, customerName, customerPhone);

      if (customerIdCard) {
        const existing = await customerService.findByIdCard(customerIdCard);
        const data = { name: customerName, idCard: customerIdCard, address: customerAddress, phone: customerPhone, email: customerEmail };
        existing ? await customerService.updateCustomer(existing.id, data) : await customerService.createCustomer(data);
      }

      if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} }
      setLastSale(sale); setSaleCompleted(true);
    } catch (error) { Alert.alert('Error', 'No se pudo registrar la venta al mayor'); } finally { setLoading(false); }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-4 gap-5">
          <View className="flex-row items-center justify-between mb-1">
            <View>
              <Text className="text-2xl font-black text-foreground tracking-tight">Venta al Mayor</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Facturación por Volumen</Text>
            </View>
            <Button title="" variant="outline" icon="close" style={{ width: 44, height: 44, borderRadius: 16 }} onPress={() => router.back()} />
          </View>

          <Card accentColor={colors.primary} style={{ backgroundColor: colors.primary + '05', paddingVertical: 12 }}>
            <View className="flex-row justify-between items-center px-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="trending-up" size={16} color={colors.primary} />
                <Text className="text-xs font-bold text-muted uppercase">Tasa Operativa:</Text>
              </View>
              <Text className="text-xl font-black text-primary">{exchangeRate.toFixed(2)} Bs/$</Text>
            </View>
          </Card>

          <View className="gap-2">
            <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">1. Selección de Producto</Text>
            <FlatList 
              data={state.products} 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              keyExtractor={item => item.id} 
              contentContainerStyle={{ gap: 10, paddingRight: 20 }} 
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => { if (loading) return; setSelectedProduct(item); setSelectedPresentation(item.presentations[0] || null); }} 
                  style={{ 
                    backgroundColor: selectedProduct?.id === item.id ? colors.primary : colors.surface, 
                    borderWidth: 1, 
                    borderColor: selectedProduct?.id === item.id ? colors.primary : colors.border, 
                    borderRadius: 16, 
                    padding: 12, 
                    minWidth: 130,
                    elevation: selectedProduct?.id === item.id ? 4 : 0,
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <Text className={`font-black text-sm ${selectedProduct?.id === item.id ? 'text-white' : 'text-foreground'}`} numberOfLines={1}>{item.name}</Text>
                  <Text className={`text-[9px] font-bold uppercase mt-1 ${selectedProduct?.id === item.id ? 'text-white/80' : 'text-muted'}`}>{item.category}</Text>
                </Pressable>
              )} 
            />
          </View>

          {selectedProduct && (
            <View className="gap-2">
              <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">2. Variación</Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedProduct.presentations.map(p => (
                  <Button 
                    key={p.id} 
                    title={`${p.name} ($${p.priceUSD.toFixed(2)})`} 
                    variant={selectedPresentation?.id === p.id ? 'primary' : 'outline'} 
                    style={{ height: 40, paddingHorizontal: 16, borderRadius: 20 }} 
                    textStyle={{ fontSize: 11 }}
                    onPress={() => setSelectedPresentation(p)}
                    disabled={loading}
                  />
                ))}
              </View>
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="flex-[1.5] gap-2">
              <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">3. Cantidad (Min. 10)</Text>
              <View className="flex-row items-center gap-2">
                <Button title="" icon="remove" variant="secondary" style={{ width: 44, height: 44 }} onPress={() => handleQuantityChange(-1)} disabled={loading} />
                <View className="flex-1 bg-surface border border-border h-11 rounded-xl items-center justify-center">
                  <Text className="text-xl font-black text-foreground">{quantity}</Text>
                </View>
                <Button title="" icon="add" variant="secondary" style={{ width: 44, height: 44 }} onPress={() => handleQuantityChange(1)} disabled={loading} />
              </View>
            </View>
            <View className="flex-1 gap-2">
              <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">4. Desc. %</Text>
              <PriceInput label="" value={manualDiscount} onChangeText={setManualDiscount} keyboardType="decimal-pad" style={{ height: 44 }} placeholder="0" />
            </View>
          </View>

          <Card style={{ gap: 4, padding: 16 }}>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Información del Cliente</Text>
              <Button title="BUSCAR" icon="search" variant="outline" fullWidth={false} style={{ height: 28, paddingHorizontal: 10, borderRadius: 14 }} textStyle={{ fontSize: 9 }} onPress={async () => { 
                const c = await customerService.findByIdCard(customerIdCard); 
                if (c) { 
                  setCustomerName(c.name); setCustomerPhone(c.phone || ''); 
                  setCustomerAddress(c.address || ''); setCustomerEmail(c.email || ''); 
                } else {
                  Alert.alert('Info', 'Cliente no encontrado');
                }
              }} />
            </View>
            <PriceInput label="Cédula / RIF" value={customerIdCard} onChangeText={setCustomerIdCard} placeholder="V-00000000" />
            <PriceInput label="Razón Social / Nombre" value={customerName} onChangeText={setCustomerName} placeholder="Nombre del cliente" />
            <PriceInput label="WhatsApp / Teléfono" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="+58412..." />
            <PriceInput label="Correo Electrónico" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" placeholder="email@ejemplo.com" />
            <PriceInput label="Dirección de Entrega" value={customerAddress} onChangeText={setCustomerAddress} multiline placeholder="Estado, Ciudad, Calle..." />
          </Card>

          <View className="gap-2">
            <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">5. Método de Pago</Text>
            <View className="flex-row gap-2">
              {(['cash', 'mobile', 'mixed', 'credit'] as const).map(type => (
                <Button 
                  key={type} 
                  title={type === 'cash' ? 'Dólares' : type === 'mobile' ? 'P. Móvil' : type === 'mixed' ? 'Mixto' : 'A Crédito'} 
                  variant={paymentType === type ? 'primary' : 'outline'} 
                  style={{ flex: 1, height: 42, borderRadius: 12, paddingHorizontal: 0 }} 
                  textStyle={{ fontSize: 9 }} 
                  onPress={() => setPaymentType(type)}
                  disabled={loading} 
                />
              ))}
            </View>
          </View>

          <Card accentColor={colors.primary} style={{ marginTop: 4, padding: 16 }}>
            <View className="flex-row justify-between items-end mb-2">
              <View>
                <Text className="text-[10px] text-muted font-black uppercase">Monto Total USD</Text>
                <Text className="text-3xl font-black text-foreground">${totalUSD.toFixed(2)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-muted font-black uppercase">Equivalente en Bs</Text>
                <Text className="text-xl font-black text-primary">{totalBS.toFixed(2)} BS</Text>
              </View>
            </View>
          </Card>

          {!saleCompleted ? (
            <Button title={loading ? "PROCESANDO..." : "REGISTRAR VENTA AL MAYOR"} variant="primary" icon="check-circle" style={{ height: 60, marginTop: 10 }} onPress={handleRecordSale} disabled={loading} />
          ) : (
            <View className="gap-3 mt-4">
              <View className="bg-emerald-500 rounded-2xl p-4 flex-row items-center justify-center gap-3">
                <MaterialIcons name="check-circle" size={24} color="white" />
                <Text className="text-white font-black text-lg">VENTA COMPLETADA</Text>
              </View>
              
              <Button title="Enviar Comprobante WhatsApp" variant="secondary" icon="chat" style={{ backgroundColor: '#25D366', borderColor: '#25D366', height: 50 }} textStyle={{ color: 'white' }} onPress={async () => { if (lastSale && selectedProduct && selectedPresentation) await receiptService.sendReceipt(lastSale, selectedProduct, selectedPresentation, customerPhone); }} />
              
              <Button title="Generar Factura PDF" variant="outline" icon="picture-as-pdf" style={{ height: 50 }} onPress={async () => { 
                setLoading(true); try { 
                  const uri = await pdfService.generateInvoice(lastSale!, selectedProduct!, selectedPresentation!, await configService.getConfig(), { name: customerName, idCard: customerIdCard, address: customerAddress, phone: customerPhone, email: customerEmail } as any);
                  await pdfService.sharePdf(uri, `Factura_${lastSale!.id.slice(-6)}.pdf`);
                } catch (e) { Alert.alert('Error', 'No se pudo generar el PDF'); } finally { setLoading(false); }
              }} />
              
              <Button title="FINALIZAR OPERACIÓN" variant="primary" onPress={() => router.replace('../(tabs)')} style={{ height: 50, marginTop: 10 }} />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
