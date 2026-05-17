import { ScrollView, Text, View, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { bcvService } from '@/lib/services/bcv.service';
import { Card, Button, StatCard } from '@/components/ui';
import { WeeklyChart } from '@/components/weekly-chart';

export default function HomeScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [refreshingRate, setRefreshingRate] = useState(false);

  const dailySummary = state.dailySummary;
  const exchangeRate = state.exchangeRate;

  // Stats
  const pendingDebts = state.debts.filter(d => d.status !== 'paid');
  const totalDebtPending = pendingDebts.reduce((acc, d) => acc + d.remainingUSD, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayExpensesTotal = state.expenses.filter(e => new Date(e.createdAt).toISOString().split('T')[0] === today).reduce((acc, e) => acc + e.amountUSD, 0);
  const netProfit = (dailySummary?.totalSales || 0) - todayExpensesTotal;

  // Stock alerts
  const lowStock = state.products.filter(p => p.presentations.some(pres => pres.stock <= (pres.lowStockThreshold || 5) && pres.stock > 0)).length;
  const outOfStock = state.products.filter(p => p.presentations.some(pres => pres.stock === 0)).length;

  // Weekly Chart Data
  const getWeeklyData = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      
      const daySales = state.sales
        .filter(s => new Date(s.createdAt).toISOString().split('T')[0] === dateStr)
        .reduce((acc, s) => acc + s.totalAmountUSD, 0);
        
      data.push({ day: dayName, amount: daySales });
    }
    return data;
  };

  const weeklyData = getWeeklyData();

  const navigate = (path: string) => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} }
    router.push(path as any);
  };

  const handleShareCatalog = async () => {
    const catalog = state.products.map(p => {
      const body = p.presentations.map(pres => `  • ${pres.name}: $${pres.priceUSD.toFixed(2)} (${(pres.priceUSD * state.exchangeRate).toFixed(2)} Bs)`).join('\n');
      return `🟢 *${p.name}*\n${body}`;
    }).join('\n\n');
    const message = `🌿 *CATÁLOGO NATURALVER'S*\n_Tasa: ${state.exchangeRate.toFixed(2)} Bs_\n\n${catalog}\n\n¡Haz tu pedido aquí! 🚀`;
    try { await Share.share({ message }); } catch (e) { Alert.alert('Error', 'No se pudo compartir'); }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-4 gap-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/40">
                <MaterialIcons name="eco" size={28} color="white" />
              </View>
              <View>
                <Text className="text-2xl font-black text-foreground tracking-tight">NaturalVer's</Text>
                <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Panel de Control</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Pressable 
                onPress={async () => { 
                  setRefreshingRate(true); 
                  try { 
                    const rate = await bcvService.forceRefresh(); 
                    dispatch({ type: 'SET_EXCHANGE_RATE', payload: rate }); 
                  } finally { 
                    setRefreshingRate(false); 
                  } 
                }} 
                className="bg-primary/10 px-3 py-1.5 rounded-2xl border border-primary/20 items-center justify-center min-w-[70]"
              >
                {refreshingRate ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View className="items-center">
                    <Text className="text-[9px] font-bold text-primary uppercase">BCV</Text>
                    <Text className="text-sm font-black text-primary">{exchangeRate.toFixed(2)}</Text>
                  </View>
                )}
              </Pressable>
              <Button title="" variant="outline" icon="settings" style={{ width: 44, height: 44, borderRadius: 16 }} onPress={() => navigate('../config')} />
            </View>
          </View>

          {/* Main Stats Card (PREMIUM LOOK) */}
          <View style={{ position: 'relative' }}>
            <Card accentColor={netProfit >= 0 ? '#10B981' : '#EF4444'} style={{ padding: 0, borderLeftWidth: 0 }}>
              <View className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
              <View className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <View className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                    <Text className="text-[10px] font-black text-white uppercase tracking-widest">Utilidad Neta Hoy</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons name="event" size={12} color="white" style={{ opacity: 0.6 }} />
                    <Text className="text-[10px] font-bold text-white/60">{new Date().toLocaleDateString('es-VE')}</Text>
                  </View>
                </View>
                
                <View>
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-6xl font-black text-white tracking-tighter">${netProfit.toFixed(2)}</Text>
                    <Text className="text-2xl font-bold text-white/40">USD</Text>
                  </View>
                  <Text className="text-base font-black text-white/80 mt-1">
                    ≈ {(netProfit * state.exchangeRate).toFixed(2)} Bs
                  </Text>
                </View>

                <View className="h-[1px] w-full bg-white/10 my-6" />
                
                <View className="flex-row justify-between">
                  <View className="gap-1">
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ventas Brutas</Text>
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="trending-up" size={16} color="#10B981" />
                      <Text className="text-xl font-black text-white">${dailySummary?.totalSales?.toFixed(2) || '0.00'}</Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">Gastos</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xl font-black text-white/90">-${todayExpensesTotal.toFixed(2)}</Text>
                      <MaterialIcons name="trending-down" size={16} color="#EF4444" />
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Income Breakdown (PREMIUM WIDGETS) */}
          <View className="flex-row gap-4">
            <StatCard 
              label="Pago Móvil" 
              value={`$${dailySummary?.totalMobileIncome?.toFixed(2) || '0.00'}`}
              subValue={`${dailySummary?.totalMobileIncomeBS?.toFixed(2) || '0.00'} Bs`}
              icon="smartphone"
              color="#34D399"
            />
            <StatCard 
              label="Efectivo" 
              value={`$${dailySummary?.totalCashIncome?.toFixed(2) || '0.00'}`}
              subValue="Respaldo en Caja"
              icon="payments"
              color="#FBBF24"
            />
          </View>

          {/* Weekly Performance Chart */}
          <WeeklyChart data={weeklyData} />

          {/* Alerts Section */}
          {(lowStock > 0 || outOfStock > 0 || totalDebtPending > 0) && (
            <View className="gap-3 mt-2">
              <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Alertas Prioritarias</Text>
              <View className="flex-row gap-3">
                {(lowStock > 0 || outOfStock > 0) && (
                  <Pressable className="flex-1" onPress={() => navigate('../products')}>
                    <View className="bg-amber-500/10 border border-amber-500/20 rounded-[24px] p-4 flex-row items-center gap-3">
                      <View className="bg-amber-500 p-2.5 rounded-xl">
                        <MaterialIcons name="inventory" size={20} color="white" />
                      </View>
                      <View>
                        <Text className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Stock</Text>
                        <Text className="text-sm font-black text-foreground">{lowStock + outOfStock} críticos</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
                {totalDebtPending > 0 && (
                  <Pressable className="flex-1" onPress={() => navigate('../debts')}>
                    <View className="bg-red-500/10 border border-red-500/20 rounded-[24px] p-4 flex-row items-center gap-3">
                      <View className="bg-red-500 p-2.5 rounded-xl">
                        <MaterialIcons name="notification-important" size={20} color="white" />
                      </View>
                      <View>
                        <Text className="text-[10px] font-black text-red-600 uppercase tracking-tighter">Deudas</Text>
                        <Text className="text-sm font-black text-foreground">${totalDebtPending.toFixed(0)} cobro</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Navigation Grid (PREMIUM BUTTONS) */}
          <View className="gap-4 mt-2">
            <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Gestión de Negocio</Text>
            <View className="flex-row gap-4">
              <Button title="Venta Rápida" icon="add-shopping-cart" style={{ flex: 1.5, height: 64, borderRadius: 24 }} onPress={() => navigate('../sales/quick-sale')} />
              <Button title="Inventario" variant="secondary" icon="inventory" style={{ flex: 1, height: 64, borderRadius: 24 }} onPress={() => navigate('../products')} />
            </View>
            
            <View className="flex-row gap-4">
              <Button title="El Fiao" variant="outline" icon="people" style={{ flex: 1, height: 56, borderRadius: 20 }} textStyle={{ fontSize: 11 }} onPress={() => navigate('../debts')} />
              <Button title="Gastos" variant="outline" icon="receipt" style={{ flex: 1, height: 56, borderRadius: 20 }} textStyle={{ fontSize: 11 }} onPress={() => navigate('../expenses')} />
              <Button title="Cierre" variant="outline" icon="lock" style={{ flex: 1, height: 56, borderRadius: 20 }} textStyle={{ fontSize: 11 }} onPress={() => navigate('../cash-close')} />
            </View>
          </View>

          <Button 
            title="COMPARTIR CATÁLOGO" 
            variant="success" 
            icon="chat" 
            style={{ marginTop: 4, height: 56 }} 
            onPress={handleShareCatalog} 
          />

          {state.error && (
            <View className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <Text className="text-[10px] text-red-600 font-bold text-center">{state.error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
