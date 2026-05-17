import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Product, ProductPresentation, Sale } from '@/lib/models';
import { receiptService } from '@/lib/services/receipt.service';
import { Button, PriceInput, Card } from '@/components/ui';
import { useWhatsApp } from '@/hooks/use-whatsapp';
import { TemplatePickerModal } from '@/components/template-picker-modal';
import { MessageTemplate } from '@/lib/models';

type PaymentType = 'mobile' | 'cash' | 'mixed';

const USD_CASH_DISCOUNT = 0.50;

export default function QuickSaleScreen() {
  const { state, recordSale } = useApp();
  const colors = useColors();
  const router = useRouter();
  const { sendMessage } = useWhatsApp();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [loading, setLoading] = useState(false);
  const savingRef = useRef(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [mixedCashPercent, setMixedCashPercent] = useState(50);
  const [showMixedSlider, setShowMixedSlider] = useState(false);

  const exchangeRate = Math.max(state.exchangeRate, 1);

  const handleQuantityChange = (delta: number) => {
    if (loading) return;
    const num = Math.max(1, (parseInt(quantity) || 0) + delta);
    setQuantity(num.toString());
  };

  const calculateTotalUSD = () => {
    if (!selectedPresentation) return 0;
    const qty = parseInt(quantity) || 0;
    if (paymentType === 'mobile' && selectedPresentation.priceBs > 0) {
      return (selectedPresentation.priceBs * qty) / exchangeRate;
    }
    let subtotal = selectedPresentation.priceUSD * qty;
    if (paymentType === 'cash') {
      subtotal = Math.max(0, subtotal - USD_CASH_DISCOUNT);
    }
    return subtotal;
  };

  const calculateTotalBS = () => {
    if (!selectedPresentation) return 0;
    const qty = parseInt(quantity) || 0;
    if (selectedPresentation.priceBs > 0) return selectedPresentation.priceBs * qty;
    return (selectedPresentation.priceUSD * qty) * exchangeRate;
  };

  const totalUSD = calculateTotalUSD();
  const totalBS = calculateTotalBS();

  const handleRecordSale = async () => {
    if (savingRef.current) return;
    if (!selectedProduct || !selectedPresentation) { Alert.alert('Error', 'Selecciona un producto'); return; }
    if (parseInt(quantity) <= 0) { Alert.alert('Error', 'Ingresa una cantidad válida'); return; }
    if (paymentType === 'mixed' && (mixedCashPercent < 0 || mixedCashPercent > 100)) {
      Alert.alert('Error', 'El porcentaje de efectivo debe estar entre 0 y 100');
      return;
    }

    try {
      savingRef.current = true;
      setLoading(true);
      const cashPct = paymentType === 'mixed' ? mixedCashPercent / 100 : (paymentType === 'cash' ? 1 : 0);
      const mobilePct = 1 - cashPct;
      const sale = await recordSale(
        selectedProduct.id, 
        selectedPresentation.id, 
        parseInt(quantity), 
        paymentType, 
        totalUSD, 
        totalBS, 
        exchangeRate, 
        paymentType === 'mobile' ? totalBS : paymentType === 'mixed' ? totalBS * mobilePct : 0, 
        paymentType === 'cash' ? totalUSD : paymentType === 'mixed' ? totalUSD * cashPct : 0,
        false,
        0,
        customerName.trim() || undefined,
        customerPhone.trim() || undefined
      );
      if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} }
      setLastSale(sale); setSaleCompleted(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      savingRef.current = false;
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-foreground tracking-tighter">Nueva Venta</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Facturación Rápida</Text>
            </View>
            <Button title="" variant="outline" icon="close" style={{ width: 48, height: 48, borderRadius: 24 }} onPress={() => router.back()} />
          </View>

          <View className="bg-primary/5 border border-primary/10 rounded-[24px] p-4 flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="bg-primary p-2 rounded-xl">
                <MaterialIcons name="trending-up" size={16} color="white" />
              </View>
              <Text className="text-xs font-black text-foreground/70 uppercase">Tasa del Día</Text>
            </View>
            <Text className="text-xl font-black text-primary">{exchangeRate.toFixed(2)} Bs/$</Text>
          </View>

          <View className="gap-3">
            <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">1. Seleccionar Producto</Text>
            <FlatList data={state.products} horizontal showsHorizontalScrollIndicator={false} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12 }} renderItem={({ item }) => {
              const isSelected = selectedProduct?.id === item.id;
              return (
                <Pressable onPress={() => { if (loading) return; if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} } setSelectedProduct(item); setSelectedPresentation(item.presentations[0] || null); }} style={{ backgroundColor: isSelected ? colors.primary : colors.surface, borderWidth: 2, borderColor: isSelected ? colors.primary : colors.border + '40', borderRadius: 24, padding: 16, minWidth: 140, opacity: loading ? 0.5 : 1 }}>
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${isSelected ? 'bg-white/20' : 'bg-primary/10'}`}>
                    <MaterialIcons name="eco" size={20} color={isSelected ? 'white' : colors.primary} />
                  </View>
                  <Text className={`text-sm font-black ${isSelected ? 'text-white' : 'text-foreground'}`}>{item.name}</Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className={`text-[10px] font-bold ${isSelected ? 'text-white/70' : 'text-muted'}`}>{item.category}</Text>
                    <Text className={`text-[9px] font-black ${isSelected ? 'text-white' : (item.presentations.some(p => p.stock <= 5) ? 'text-red-500' : 'text-foreground')}`}>
                      Stock: {item.presentations.reduce((a, b) => a + b.stock, 0)}
                    </Text>
                  </View>
                </Pressable>
              );
            }} />
          </View>

          {selectedProduct && (
            <View className="gap-2">
              <Text className="text-xs font-bold text-muted uppercase">2. Presentación</Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedProduct.presentations.map(p => (
                  <Button key={p.id} title={`${p.name} - $${p.priceUSD.toFixed(2)}`} variant={selectedPresentation?.id === p.id ? 'primary' : 'outline'} style={{ height: 40, paddingHorizontal: 12 }} onPress={() => setSelectedPresentation(p)} disabled={loading} />
                ))}
              </View>
            </View>
          )}

          <View className="gap-3">
            <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">3. Cantidad</Text>
            <View className="flex-row items-center gap-4">
              <Button title="" icon="remove" variant="secondary" style={{ width: 64, height: 64, borderRadius: 20 }} onPress={() => handleQuantityChange(-1)} disabled={loading} />
              <View className="flex-1 bg-surface border border-border h-16 rounded-[24px] items-center justify-center">
                <Text className="text-3xl font-black text-foreground">{quantity}</Text>
              </View>
              <Button title="" icon="add" variant="secondary" style={{ width: 64, height: 64, borderRadius: 20 }} onPress={() => handleQuantityChange(1)} disabled={loading} />
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">4. Método de Pago</Text>
            <View className="flex-row gap-3">
              {(['cash', 'mobile', 'mixed'] as const).map(type => {
                const isSelected = paymentType === type;
                const icon = type === 'cash' ? 'payments' : type === 'mobile' ? 'smartphone' : 'account-balance-wallet';
                const label = type === 'cash' ? 'Efectivo' : type === 'mobile' ? 'Móvil' : 'Mixto';
                return (
                  <Pressable 
                    key={type}
                    onPress={() => { if (loading) return; setPaymentType(type); }}
                    className={`flex-1 items-center justify-center py-5 rounded-2xl border-2 ${isSelected ? 'bg-primary border-primary' : 'bg-surface border-border/40'}`}
                    style={{ opacity: loading ? 0.5 : 1 }}
                  >
                    <MaterialIcons name={icon} size={24} color={isSelected ? 'white' : colors.muted} />
                    <Text className={`text-[10px] font-black uppercase mt-2 ${isSelected ? 'text-white' : 'text-muted'}`}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {paymentType === 'mixed' && (
              <View className="bg-surface rounded-2xl border border-border/40 p-4 gap-3">
                <Text className="text-[10px] font-black text-muted uppercase tracking-widest">División del Pago</Text>
                <View className="flex-row items-center gap-4">
                  <Text className="text-xs font-bold text-muted">Efectivo</Text>
                  <View className="flex-1 flex-row gap-2">
                    {[25, 50, 75].map(pct => (
                      <Pressable
                        key={pct}
                        onPress={() => setMixedCashPercent(pct)}
                        className={`flex-1 py-3 rounded-xl border-2 items-center ${mixedCashPercent === pct ? 'bg-primary border-primary' : 'bg-surface border-border/40'}`}
                      >
                        <Text className={`text-xs font-black ${mixedCashPercent === pct ? 'text-white' : 'text-foreground'}`}>{pct}%</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text className="text-xs font-bold text-muted">Móvil</Text>
                </View>
                <View className="bg-primary/5 rounded-xl p-3">
                  <Text className="text-center text-xs font-bold text-foreground">
                    ${(totalUSD * mixedCashPercent / 100).toFixed(2)} efectivo + {((100 - mixedCashPercent)).toFixed(0)}% móvil (Bs {(totalBS * (100 - mixedCashPercent) / 100).toFixed(2)})
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View className="gap-3">
            <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">5. Datos del Cliente (Opcional)</Text>
            <View className="gap-2">
              <PriceInput label="Nombre del Cliente" value={customerName} onChangeText={setCustomerName} placeholder="Ej: Maria López" />
              <PriceInput label="WhatsApp" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="+584120000000" />
            </View>
          </View>

          <View className="mt-2">
            <Card accentColor={colors.primary} style={{ padding: 0 }}>
              <View className="bg-primary/5 p-6 border-b border-border/10">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs font-black text-muted uppercase tracking-widest">Total a Cobrar</Text>
                  <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/20">
                    <Text className="text-[9px] font-black text-primary uppercase">USD / BS</Text>
                  </View>
                </View>
                <View className="mt-4">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-5xl font-black text-foreground tracking-tighter">${totalUSD.toFixed(2)}</Text>
                    <Text className="text-xl font-bold text-muted">USD</Text>
                  </View>
                  <Text className="text-lg font-black text-primary mt-1">≈ {totalBS.toFixed(2)} BS</Text>
                  {paymentType === 'cash' && selectedPresentation && (
                    <View className="bg-emerald-500/10 rounded-xl px-3 py-2 mt-2 border border-emerald-500/20">
                      <Text className="text-[11px] font-black text-emerald-600 text-center">
                        💰 Descuento Efectivo: -${USD_CASH_DISCOUNT.toFixed(2)} USD
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </View>

          {!saleCompleted ? (
            <Button 
              title={loading ? "PROCESANDO..." : "COMPLETAR VENTA"} 
              variant="primary" 
              style={{ height: 64, borderRadius: 20, marginTop: 4 }} 
              onPress={handleRecordSale} 
              disabled={loading} 
              icon={loading ? undefined : 'check-circle'}
            />
          ) : (
            <View className="gap-5">
              <View className="bg-emerald-500 rounded-[40px] p-8 items-center gap-4">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
                  <MaterialIcons name="check" size={48} color="white" />
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-black text-white tracking-tight">¡Venta Exitosa!</Text>
                  <Text className="text-white/80 font-bold text-center mt-1">La transacción se registró correctamente.</Text>
                </View>
              </View>

              <View className="gap-3">
                <Button 
                  title="ENVIAR RECIBO WHATSAPP" 
                  variant="secondary" 
                  icon="share" 
                  style={{ height: 60, borderRadius: 20, backgroundColor: '#25D366', borderColor: '#25D366' }} 
                  textStyle={{ color: 'white' }} 
                  onPress={async () => { if (lastSale && selectedProduct && selectedPresentation) await receiptService.sendReceipt(lastSale, selectedProduct, selectedPresentation); }} 
                />
                
                {state.templates.length > 0 && (
                  <View className="gap-2 mt-2">
                    <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mensajes Adicionales</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      <Button 
                        title="USAR PLANTILLA" 
                        variant="outline" 
                        icon="chat" 
                        style={{ height: 44, paddingHorizontal: 20, borderRadius: 22 }} 
                        textStyle={{ fontSize: 11 }} 
                        onPress={() => setTemplateModalVisible(true)} 
                      />
                      {state.templates.slice(0, 3).map(t => (
                        <Button 
                          key={t.id} 
                          title={t.title} 
                          variant="secondary" 
                          style={{ height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.surface }} 
                          textStyle={{ fontSize: 10 }} 
                          onPress={() => {
                            let msg = t.content
                              .replace(/\[CLIENTE\]/g, customerName || 'Cliente')
                              .replace(/\[PRODUCTO\]/g, selectedProduct?.name || '')
                              .replace(/\[TOTAL\]/g, `$${totalUSD.toFixed(2)}`)
                              .replace(/\[TASA\]/g, exchangeRate.toFixed(2));
                            sendMessage(customerPhone, msg);
                          }} 
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <Button 
                  title="FINALIZAR" 
                  variant="outline" 
                  style={{ height: 60, borderRadius: 20, marginTop: 10 }} 
                  onPress={() => router.replace('../(tabs)')} 
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <TemplatePickerModal 
        visible={templateModalVisible}
        onClose={() => setTemplateModalVisible(false)}
        onSelect={(template) => {
          let processedMsg = template.content
            .replace(/\[CLIENTE\]/g, customerName || 'Cliente')
            .replace(/\[PRODUCTO\]/g, selectedProduct?.name || '')
            .replace(/\[TOTAL\]/g, `$${totalUSD.toFixed(2)}`)
            .replace(/\[TOTAL_BS\]/g, `${totalBS.toFixed(2)} Bs`)
            .replace(/\[TASA\]/g, exchangeRate.toFixed(2));
          
          sendMessage(customerPhone, processedMsg);
        }}
      />
    </ScreenContainer>
  );
}
