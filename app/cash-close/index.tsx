import { ScrollView, Text, View, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { cashRegistryService } from '@/lib/services/cashregistry.service';
import { pdfService } from '@/lib/services/pdf.service';
import { excelService } from '@/lib/services/excel.service';
import { configService } from '@/lib/services/config.service';
import { Button, PriceInput, Card, StatCard } from '@/components/ui';
import { useWhatsApp } from '@/hooks/use-whatsapp';

export default function CashCloseScreen() {
  const { state, loadAppData } = useApp();
  const colors = useColors();
  const router = useRouter();
  const { sendMessage } = useWhatsApp();
  
  const [openingBalance, setOpeningBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [closedData, setClosedData] = useState<{ pdf: string, excel: string } | null>(null);

  const exchangeRate = Math.max(state.exchangeRate, 1);
  const today = new Date().toISOString().split('T')[0];

  // Cálculos de hoy (usando timestamps numéricos)
  const todaySales = state.sales.filter(s => {
    const saleDate = new Date(s.createdAt).toISOString().split('T')[0];
    return saleDate === today;
  });
  
  const todayExpenses = state.expenses.filter(e => {
    const expenseDate = new Date(e.createdAt).toISOString().split('T')[0];
    return expenseDate === today;
  });
  
  const totalSalesUSD = todaySales.reduce((acc, s) => acc + s.totalAmountUSD, 0);
  const totalExpensesUSD = todayExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
  
  const netProfitUSD = totalSalesUSD - totalExpensesUSD;
  const netProfitBs = netProfitUSD * exchangeRate;

  const handleCloseDay = async () => {
    try {
      setLoading(true);
      if (Platform.OS !== 'web') {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch(err) {};
      }

      // El servicio usa createClose(sales, expenses, openingBalanceUSD, totalSalesUSD, totalExpensesUSD, exchangeRate)
      const result = await cashRegistryService.createClose(
        todaySales,
        todayExpenses,
        parseFloat(openingBalance) || 0,
        totalSalesUSD,
        totalExpensesUSD,
        exchangeRate
      );

      const config = await configService.getConfig();
      const dailySummary = await excelService.generateReport(todaySales, todayExpenses, {
        totalSales: totalSalesUSD,
        totalExpenses: totalExpensesUSD,
        totalMobileIncome: todaySales.filter(s => s.paymentType === 'mobile').reduce((a, s) => a + s.totalAmountUSD, 0),
        totalCashIncome: todaySales.filter(s => s.paymentType === 'cash').reduce((a, s) => a + s.totalAmountUSD, 0),
        productsCount: todaySales.reduce((a, s) => a + s.quantity, 0),
        exchangeRate,
      }, `Cierre_${today}`);
      const pdfUri = await pdfService.generateDailyReport(todaySales, todayExpenses, {
        totalSales: totalSalesUSD,
        totalExpenses: totalExpensesUSD,
        productsCount: todaySales.reduce((a, s) => a + s.quantity, 0),
      }, config);
      setClosedData({ pdf: pdfUri, excel: dailySummary });
      
      await loadAppData();
      Alert.alert('¡Cierre Exitoso!', 'El día se ha cerrado correctamente y los reportes están listos.');
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      Alert.alert('Error', 'No se pudo procesar el cierre. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAdmin = () => {
    const mobileSales = todaySales.filter(s => s.paymentType === 'mobile').reduce((acc, s) => acc + s.totalAmountUSD, 0);
    const cashSales = todaySales.filter(s => s.paymentType === 'cash').reduce((acc, s) => acc + s.totalAmountUSD, 0);
    
    const report = `📊 *CIERRE DE CAJA - NATURALVER*\n` +
      `📅 Fecha: ${new Date().toLocaleDateString('es-VE')}\n` +
      `--------------------------------\n` +
      `💰 *Ventas:* $${totalSalesUSD.toFixed(2)}\n` +
      `   💵 Efectivo: $${cashSales.toFixed(2)}\n` +
      `   📲 Pago Móvil: $${mobileSales.toFixed(2)}\n` +
      `📉 *Gastos:* $${totalExpensesUSD.toFixed(2)}\n` +
      `--------------------------------\n` +
      `💵 *UTILIDAD:* $${netProfitUSD.toFixed(2)}\n` +
      `🏦 *Equivalente:* ${netProfitBs.toFixed(2)} BS\n` +
      `✨ Tasa: ${exchangeRate.toFixed(2)} BS`;
    
    sendMessage('', report);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-foreground tracking-tighter">Cierre de Caja</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Balance Final del Día</Text>
            </View>
            <Button title="" variant="outline" icon="close" style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => router.back()} />
          </View>

          {!closedData && (
            <Card accentColor={colors.primary}>
              <Text className="text-xs font-black text-muted uppercase tracking-widest mb-3">Configuración Inicial</Text>
              <PriceInput 
                label="Fondo de Caja (USD)" 
                value={openingBalance} 
                onChangeText={setOpeningBalance} 
                keyboardType="decimal-pad"
                placeholder="0.00"
                currency="$"
              />
            </Card>
          )}

          <View className="gap-3">
            <Text className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Rendimiento del Día</Text>
            <Card accentColor={netProfitUSD >= 0 ? '#10B981' : '#EF4444'} variant="glass" style={{ padding: 0 }}>
              <View className="items-center py-8">
                <Text className="text-xs font-black text-muted uppercase tracking-widest mb-2">Utilidad Neta Estimada</Text>
                <View className="flex-row items-baseline gap-2">
                  <Text className={`text-6xl font-black ${netProfitUSD >= 0 ? 'text-emerald-500' : 'text-red-500'} tracking-tighter`}>
                    ${netProfitUSD.toFixed(2)}
                  </Text>
                  <Text className="text-xl font-bold text-muted">USD</Text>
                </View>
                
                <View className="h-[1px] w-[80%] bg-border/10 my-6" />
                
                <View className="flex-row justify-around w-full">
                  <View className="items-center">
                    <Text className="text-[10px] font-bold text-muted uppercase tracking-tighter mb-1">Bolívares</Text>
                    <Text className="text-xl font-black text-foreground">{netProfitBs.toFixed(2)} Bs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[10px] font-bold text-muted uppercase tracking-tighter mb-1">Tasa Aplicada</Text>
                    <Text className="text-xl font-black text-primary">{exchangeRate.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </Card>

            <View className="flex-row gap-4">
              <StatCard 
                label="Ingresos" 
                value={`$${totalSalesUSD.toFixed(2)}`} 
                icon="trending-up" 
                color="#10B981" 
                style={{ flex: 1 }}
              />
              <StatCard 
                label="Egresos" 
                value={`$${totalExpensesUSD.toFixed(2)}`} 
                icon="trending-down" 
                color="#EF4444" 
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <View className="flex-1" />

          {closedData ? (
            <View className="gap-4 pb-6">
              <View className="bg-emerald-500 rounded-[32px] p-6 items-center flex-row gap-4 shadow-lg shadow-emerald-500/20">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <MaterialIcons name="verified" size={28} color="white" />
                </View>
                <View>
                  <Text className="text-lg font-black text-white tracking-tight">Día Cerrado</Text>
                  <Text className="text-white/80 text-xs font-bold uppercase">Operación Exitosa</Text>
                </View>
              </View>
              
              <View className="flex-row gap-3">
                <Button title="PDF" variant="secondary" icon="picture-as-pdf" style={{ flex: 1, height: 60, borderRadius: 16 }} onPress={() => pdfService.sharePdf(closedData.pdf, `Cierre_${today}.pdf`)} />
                <Button title="EXCEL" variant="secondary" icon="table-chart" style={{ flex: 1, height: 60, borderRadius: 16 }} onPress={() => excelService.shareExcel(closedData.excel)} />
              </View>
              
              <Button title="ENVIAR A ADMINISTRADOR" variant="primary" icon="send" style={{ height: 64, borderRadius: 20, backgroundColor: colors.primary }} onPress={handleSendToAdmin} />
              <Button title="FINALIZAR" variant="outline" style={{ height: 56, borderRadius: 16 }} onPress={() => router.replace('/(tabs)')} />
            </View>
          ) : (
            <View className="pb-6">
              <Button 
                title={loading ? "PROCESANDO CIERRE..." : "EJECUTAR CIERRE DE CAJA"} 
                variant="primary"
                loading={loading} 
                onPress={handleCloseDay} 
                style={{ height: 72, borderRadius: 24, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }} 
                textStyle={{ fontSize: 16, letterSpacing: 1 }}
                icon="lock"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
