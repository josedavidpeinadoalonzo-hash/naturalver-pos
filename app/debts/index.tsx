import { ScrollView, Text, View, Pressable, FlatList, TextInput, Alert, Modal } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Debt } from '@/lib/models';
import { debtService } from '@/lib/services/debt.service';
import { Button, PriceInput, Card } from '@/components/ui';
import { useWhatsApp } from '@/hooks/use-whatsapp';
import { TemplatePickerModal } from '@/components/template-picker-modal';
import { MessageTemplate } from '@/lib/models';

export default function DebtsScreen() {
  const { state, refreshDebts } = useApp();
  const colors = useColors();
  const router = useRouter();
  const { sendMessage } = useWhatsApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('pending');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const filteredDebts = state.debts.filter(d => filter === 'all' ? true : d.status === filter);
  const totalPending = state.debts.filter(d => d.status !== 'paid').reduce((acc, d) => acc + d.remainingUSD, 0);

  const handleAddDebt = async () => {
    if (!customerName.trim() || !productName.trim() || !totalAmount.trim()) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    try {
      await debtService.createDebt(customerName.trim(), productName.trim(), parseFloat(totalAmount) || 0, undefined, customerPhone.trim() || undefined);
      if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} }
      setCustomerName(''); setCustomerPhone(''); setProductName(''); setTotalAmount('');
      setShowAddForm(false);
      await refreshDebts();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la deuda');
    }
  };

  const handleAddPayment = (debt: Debt) => {
    setPaymentDebt(debt);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentDebt) return;
    const amount = parseFloat(paymentAmount.replace(',', '.')) || 0;
    if (amount <= 0) { Alert.alert('Error', 'Ingresa un monto válido mayor a cero'); return; }
    if (amount > paymentDebt.remainingUSD) { Alert.alert('Error', `El abono no puede exceder $${paymentDebt.remainingUSD.toFixed(2)}`); return; }
    try {
      await debtService.addPayment(paymentDebt.id, amount, amount * state.exchangeRate, 'cash', state.exchangeRate);
      if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} }
      await refreshDebts();
      setShowPaymentModal(false);
      setPaymentDebt(null);
    } catch (error) { Alert.alert('Error', 'No se pudo registrar'); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#EF4444';
      case 'partial': return '#F59E0B';
      case 'paid': return '#10B981';
      default: return colors.muted;
    }
  };

  const renderDebtCard = ({ item }: { item: Debt }) => (
    <Card accentColor={getStatusColor(item.status)} style={{ marginBottom: 12, padding: 16 }}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-black text-foreground mb-0.5">{item.customerName}</Text>
          {item.customerPhone && (
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="phone" size={10} color={colors.muted} />
              <Text className="text-[10px] text-muted font-bold">{item.customerPhone}</Text>
            </View>
          )}
        </View>
        <View style={{ backgroundColor: getStatusColor(item.status) + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: getStatusColor(item.status) + '30' }}>
          <Text style={{ color: getStatusColor(item.status), fontSize: 9, fontWeight: '900' }} className="uppercase">
            {item.status === 'pending' ? 'Pendiente' : item.status === 'partial' ? 'Con Abonos' : 'Saldado'}
          </Text>
        </View>
      </View>

      <View className="bg-background rounded-xl p-3 border border-border mb-3">
        <Text className="text-[10px] text-muted font-bold uppercase mb-2">Resumen de Cuenta</Text>
        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-[9px] text-muted font-bold uppercase">Deuda Total</Text>
            <Text className="text-sm font-black text-foreground">${item.totalAmountUSD.toFixed(2)}</Text>
          </View>
          <View className="items-center">
            <Text className="text-[9px] text-muted font-bold uppercase">Pagado</Text>
            <Text className="text-sm font-black text-emerald-500">${item.paidAmountUSD.toFixed(2)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] text-muted font-bold uppercase">Restante</Text>
            <Text className="text-xl font-black text-red-500">${item.remainingUSD.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mb-4">
        <MaterialIcons name="shopping-bag" size={14} color={colors.muted} />
        <Text className="text-xs text-muted font-medium">{item.productName}</Text>
      </View>

      {item.status !== 'paid' && (
        <View className="flex-row gap-2">
          <Button title="ABONAR" variant="success" icon="payments" style={{ flex: 2, height: 44 }} onPress={() => handleAddPayment(item)} />
          {item.customerPhone && (
            <Button 
              title="" 
              variant="secondary" 
              icon="chat" 
              style={{ width: 50, height: 44, backgroundColor: '#25D366', borderColor: '#25D366' }} 
              onPress={() => {
                const msg = `Hola ${item.customerName}, te recordamos tu saldo de $${item.remainingUSD.toFixed(2)} en NaturalVer's por ${item.productName}.`;
                sendMessage(item.customerPhone!, msg);
              }} 
            />
          )}
          <Button title="" variant="outline" icon="delete-outline" style={{ width: 50, height: 44, borderColor: '#EF4444' }} iconColor="#EF4444" onPress={() => Alert.alert('Eliminar', '¿Eliminar registro de deuda?', [{ text: 'No' }, { text: 'Sí', style: 'destructive', onPress: async () => { await debtService.deleteDebt(item.id); refreshDebts(); } }])} />
        </View>
      )}
    </Card>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-foreground tracking-tighter">Cuentas</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Gestión de Cobranzas</Text>
            </View>
            <View className="flex-row gap-2">
              <Button title="" variant={showAddForm ? "primary" : "outline"} icon={showAddForm ? "remove" : "add"} style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => setShowAddForm(!showAddForm)} />
              <Button title="" variant="outline" icon="close" style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => router.back()} />
            </View>
          </View>

          {/* Premium Total Summary */}
          <Card accentColor="#EF4444" variant="glass" style={{ padding: 0 }}>
            <View className="p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Total por Cobrar</Text>
                <MaterialIcons name="account-balance-wallet" size={18} color="#EF4444" />
              </View>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-5xl font-black text-red-500 tracking-tighter">${totalPending.toFixed(2)}</Text>
                <Text className="text-xl font-bold text-muted">USD</Text>
              </View>
              <Text className="text-lg font-black text-foreground/40 mt-1">≈ {(totalPending * state.exchangeRate).toFixed(2)} BS</Text>
              
              <View className="h-[1px] bg-border/10 my-4" />
              
              <View className="flex-row items-center gap-2">
                <View className="bg-red-500/10 px-2 py-1 rounded-md">
                  <Text className="text-[10px] font-black text-red-600 uppercase">{state.debts.filter(d => d.status !== 'paid').length} Clientes Pendientes</Text>
                </View>
              </View>
            </View>
          </Card>

          {showAddForm && (
            <Card style={{ gap: 4 }} accentColor={colors.primary}>
              <View className="mb-2">
                <Text className="text-sm font-black text-foreground tracking-tight">Nueva Cuenta por Cobrar</Text>
                <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Detalles del crédito</Text>
              </View>
              
              <PriceInput label="Nombre del Cliente" value={customerName} onChangeText={setCustomerName} placeholder="Ej: Juan Pérez" />
              <PriceInput label="WhatsApp (Opcional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="+584120000000" />
              <PriceInput label="Concepto" value={productName} onChangeText={setProductName} placeholder="Ej: Kit NaturalVer x3" />
              <PriceInput label="Monto Total (USD)" currency="$" value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" placeholder="0.00" />
              
              <Button title="REGISTRAR DEUDA" variant="primary" icon="check-circle" onPress={handleAddDebt} style={{ height: 56, marginTop: 10, borderRadius: 16 }} />
            </Card>
          )}

          <View className="gap-3">
            <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Filtros de Estado</Text>
            <View className="flex-row gap-2">
              {(['pending', 'partial', 'paid', 'all'] as const).map(f => (
                <Button 
                  key={f} 
                  title={f === 'pending' ? 'Pendiente' : f === 'partial' ? 'Abonos' : f === 'paid' ? 'Pagado' : 'Todos'} 
                  variant={filter === f ? 'primary' : 'secondary'}
                  style={{ flex: 1, height: 40, borderRadius: 12, paddingHorizontal: 0 }}
                  textStyle={{ fontSize: 9, fontWeight: '900' }}
                  onPress={() => setFilter(f)} 
                />
              ))}
            </View>
          </View>

          <View className="gap-4 pb-10">
            {filteredDebts.map(item => (
              <Card key={item.id} accentColor={getStatusColor(item.status)} style={{ padding: 0, marginBottom: 4 }}>
                <View className="p-5">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-lg font-black text-foreground tracking-tight">{item.customerName}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="bg-primary/5 px-2 py-0.5 rounded">
                          <Text className="text-[9px] font-bold text-primary uppercase">{item.productName}</Text>
                        </View>
                        {item.customerPhone && (
                          <Text className="text-[9px] text-muted font-bold tracking-tighter">{item.customerPhone}</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ backgroundColor: getStatusColor(item.status) + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ color: getStatusColor(item.status), fontSize: 9, fontWeight: '900' }} className="uppercase">
                        {item.status === 'pending' ? 'Pendiente' : item.status === 'partial' ? 'Con Abonos' : 'Saldado'}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-background border border-border/40 rounded-[20px] p-4 flex-row justify-between mb-5 shadow-sm">
                    <View>
                      <Text className="text-[9px] text-muted font-black uppercase mb-1">Pagado</Text>
                      <Text className="text-sm font-black text-emerald-500">${item.paidAmountUSD.toFixed(2)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[9px] text-muted font-black uppercase mb-1">Deuda Pendiente</Text>
                      <Text className="text-2xl font-black text-red-500 tracking-tighter">${item.remainingUSD.toFixed(2)}</Text>
                    </View>
                  </View>

                  {item.status !== 'paid' && (
                    <View className="flex-row gap-3">
                      <Button title="ABONAR" variant="success" icon="add-circle" style={{ flex: 2, height: 50, borderRadius: 16 }} onPress={() => handleAddPayment(item)} />
                      {item.customerPhone && (
                        <Button 
                          title="" 
                          variant="secondary" 
                          icon="message" 
                          style={{ width: 56, height: 50, borderRadius: 16, backgroundColor: '#25D366', borderColor: '#25D366' }} 
                          onPress={() => {
                            setSelectedDebt(item);
                            setTemplateModalVisible(true);
                          }} 
                        />
                      )}
                      <Button 
                        title="" 
                        variant="outline" 
                        icon="delete-outline" 
                        style={{ width: 56, height: 50, borderRadius: 16, borderColor: '#EF444420' }} 
                        iconColor="#EF4444" 
                        onPress={() => Alert.alert('Eliminar', '¿Eliminar registro de deuda?', [{ text: 'No' }, { text: 'Sí', style: 'destructive', onPress: async () => { await debtService.deleteDebt(item.id); refreshDebts(); } }])} 
                      />
                    </View>
                  )}
                </View>
              </Card>
            ))}

            {filteredDebts.length === 0 && (
              <View className="items-center py-24 opacity-30">
                <View className="bg-emerald-500/10 p-6 rounded-full mb-4">
                  <MaterialIcons name="verified" size={64} color="#10B981" />
                </View>
                <Text className="text-emerald-700 text-lg font-black uppercase tracking-widest">¡Todo al día!</Text>
                <Text className="text-muted font-bold text-center mt-2">No hay cuentas pendientes en esta categoría</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TemplatePickerModal 
        visible={templateModalVisible}
        onClose={() => { setTemplateModalVisible(false); setSelectedDebt(null); }}
        onSelect={(template) => {
          if (!selectedDebt || !selectedDebt.customerPhone) return;
          
          let processedMsg = template.content
            .replace(/\[CLIENTE\]/g, selectedDebt.customerName)
            .replace(/\[PRODUCTO\]/g, selectedDebt.productName)
            .replace(/\[SALDO\]/g, `$${selectedDebt.remainingUSD.toFixed(2)}`)
            .replace(/\[SALDO_BS\]/g, `${(selectedDebt.remainingUSD * state.exchangeRate).toFixed(2)} Bs`)
            .replace(/\[TASA\]/g, state.exchangeRate.toFixed(2));
          
          sendMessage(selectedDebt.customerPhone, processedMsg);
          setSelectedDebt(null);
        }}
      />

      <Modal visible={showPaymentModal} transparent animationType="fade" onRequestClose={() => setShowPaymentModal(false)}>
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-surface rounded-[28px] p-6 mx-6 w-[85%]" style={{ borderWidth: 1, borderColor: colors.border + '40' }}>
            <Text className="text-xl font-black text-foreground tracking-tight mb-1">Registrar Abono</Text>
            {paymentDebt && (
              <Text className="text-sm text-muted font-bold mb-1">{paymentDebt.customerName}</Text>
            )}
            <View className="bg-red-500/10 rounded-xl px-4 py-3 mb-4">
              <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Pendiente</Text>
              <Text className="text-2xl font-black text-red-500">${paymentDebt?.remainingUSD.toFixed(2) || '0.00'} USD</Text>
            </View>

            <PriceInput
              label="Monto del Abono (USD)"
              currency="$"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              autoFocus
            />

            <View className="flex-row gap-3 mt-2">
              <Button title="CANCELAR" variant="outline" style={{ flex: 1, height: 52, borderRadius: 16 }} onPress={() => { setShowPaymentModal(false); setPaymentDebt(null); }} />
              <Button title="REGISTRAR" variant="primary" style={{ flex: 1, height: 52, borderRadius: 16 }} onPress={handleConfirmPayment} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
