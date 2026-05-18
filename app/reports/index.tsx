import { ScrollView, Text, View, Pressable, Share } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Alert, Linking } from 'react-native';
import { excelService } from '@/lib/services/excel.service';
import { pdfService } from '@/lib/services/pdf.service';
import { useWhatsApp } from '@/hooks/use-whatsapp';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export default function ReportsScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();
  const { sendMessage } = useWhatsApp();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [exporting, setExporting] = useState(false);

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {};
    }
    setPeriod(newPeriod);
  };

  const handleExportExcel = async () => {
    const summary = getSummary();
    if (!summary) return;
    
    try {
      setExporting(true);
      const title = period === 'daily' ? 'Diario' : period === 'weekly' ? 'Semanal' : 'Mensual';
      const uri = await excelService.generateReport(state.sales, [], summary, title);
      await excelService.shareExcel(uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleShareClose = async () => {
    const summary = getSummary();
    if (!summary) return;

    const title = period === 'daily' ? 'DIARIO' : period === 'weekly' ? 'SEMANAL' : 'MENSUAL';
    const msg = `📊 *CIERRE DE CAJA ${title}*\n` +
                `🏪 NaturalVer's\n\n` +
                `💰 *Ventas Totales:* $${summary.totalSales.toFixed(2)}\n` +
                `📱 *Pago Móvil:* ${ (summary.totalMobileIncome * state.exchangeRate).toFixed(2) } Bs\n` +
                `💵 *Efectivo:* $${summary.totalCashIncome.toFixed(2)}\n` +
                `📦 *Productos:* ${summary.productsCount}\n` +
                `🤝 *Transacciones:* ${summary.salesCount}\n\n` +
                `📈 _Tasa: ${state.exchangeRate.toFixed(2)} Bs/$_\n` +
                `✅ ¡Cierre completado!`;
    
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    try { await Linking.openURL(url); } catch (_) { await Share.share({ message: msg }); }
  };

  const handleBack = () => {
    router.back();
  };

  const getSummary = () => {
    switch (period) {
      case 'daily':
        return state.dailySummary;
      case 'weekly':
        return state.weeklySummary;
      case 'monthly':
        return state.monthlySummary;
    }
  };

  const summary = getSummary();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-foreground">Reportes</Text>
            <Pressable onPress={handleBack}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Selector de Período */}
          <View className="flex-row gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <Pressable
                key={p}
                onPress={() => handlePeriodChange(p)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: period === p ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: period === p ? colors.primary : colors.border,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  className={`text-xs font-semibold ${
                    period === p ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : 'Mensual'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Resumen */}
          {summary && (
            <View className="gap-4">
              {/* Ventas Totales */}
              <Pressable
                onPress={() => {
                  const periodLabel = period === 'daily' ? 'diario' : period === 'weekly' ? 'semanal' : 'mensual';
                  Alert.alert(`Resumen ${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}`,
                    `Ventas Totales: $${summary.totalSales.toFixed(2)}\n` +
                    `Transacciones: ${summary.salesCount}\n` +
                    `Productos Vendidos: ${summary.productsCount}\n\n` +
                    `Pago Móvil: $${summary.totalMobileIncome.toFixed(2)}\n` +
                    `Efectivo: $${summary.totalCashIncome.toFixed(2)}`
                  );
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row items-center gap-2 mb-2">
                    <MaterialIcons name="trending-up" size={20} color={colors.primary} />
                    <Text className="text-sm text-muted">Ventas Totales</Text>
                  </View>
                  <Text className="text-3xl font-bold text-foreground">
                    ${summary.totalSales.toFixed(2)}
                  </Text>
                </View>
              </Pressable>

              {/* Ingresos por Tipo de Pago */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => Alert.alert('Pago Móvil',
                    `Total: $${summary.totalMobileIncome.toFixed(2)}\n` +
                    `Porcentaje: ${summary.totalSales > 0 ? ((summary.totalMobileIncome / summary.totalSales) * 100).toFixed(1) : 0}% de las ventas`
                  )}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="bg-surface rounded-lg p-4 border border-border">
                    <View className="flex-row items-center gap-2 mb-2">
                      <MaterialIcons name="phone" size={16} color="#34D399" />
                      <Text className="text-xs text-muted">Pago Móvil</Text>
                    </View>
                    <Text className="text-lg font-bold text-foreground">
                      ${summary.totalMobileIncome.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => Alert.alert('Efectivo USD',
                    `Total: $${summary.totalCashIncome.toFixed(2)}\n` +
                    `Porcentaje: ${summary.totalSales > 0 ? ((summary.totalCashIncome / summary.totalSales) * 100).toFixed(1) : 0}% de las ventas`
                  )}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                    <View className="flex-row items-center gap-2 mb-2">
                      <MaterialIcons name="attach-money" size={16} color="#FBBF24" />
                      <Text className="text-xs text-muted">Dólares</Text>
                    </View>
                    <Text className="text-lg font-bold text-foreground">
                      ${summary.totalCashIncome.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Estadísticas */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => Alert.alert('Productos Vendidos',
                    `Total: ${summary.productsCount} unidades\n` +
                    `Distribuidas en ${summary.salesCount} transacciones\n` +
                    `Promedio: ${summary.salesCount > 0 ? (summary.productsCount / summary.salesCount).toFixed(1) : 0} productos por venta`
                  )}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                    <Text className="text-xs text-muted mb-2">Productos Vendidos</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {summary.productsCount}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => Alert.alert('Transacciones',
                    `Total: ${summary.salesCount} ventas\n` +
                    `Ticket promedio: $${summary.salesCount > 0 ? (summary.totalSales / summary.salesCount).toFixed(2) : '0.00'}`
                  )}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                    <Text className="text-xs text-muted mb-2">Transacciones</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {summary.salesCount}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Detalle de Ventas */}
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Detalle de Ventas
                </Text>
                <View className="gap-2">
                  <View className="flex-row justify-between pb-2 border-b border-border">
                    <Text className="text-xs text-muted">Concepto</Text>
                    <Text className="text-xs text-muted">Monto</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-foreground">Ventas Totales</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      ${summary.totalSales.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-foreground">Pago Móvil</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      ${summary.totalMobileIncome.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-foreground">Dólares Físicos</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      ${summary.totalCashIncome.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-foreground">Productos Vendidos</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {summary.productsCount}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-foreground">Transacciones</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {summary.salesCount}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botones de Exportación */}
              <View className="flex-row gap-3 mt-4">
                <Pressable
                  onPress={handleExportExcel}
                  disabled={exporting}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: (pressed || exporting) ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="table-chart" size={18} color="#10B981" />
                  <Text className="text-foreground font-semibold text-sm">{exporting ? '...' : 'Excel'}</Text>
                </Pressable>

                <Pressable
                  onPress={handleShareClose}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: '#25D366',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="share" size={18} color="white" />
                  <Text className="text-white font-semibold text-sm">Cierre</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Estado de Carga */}
          {state.loading && (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm text-muted">Cargando reportes...</Text>
            </View>
          )}

          {/* Mostrar Errores */}
          {state.error && (
            <View className="bg-red-900/20 rounded-lg p-4 border border-red-500">
              <Text className="text-sm text-red-400">{state.error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
