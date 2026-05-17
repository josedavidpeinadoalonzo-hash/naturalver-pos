import { ScrollView, Text, View, Pressable, TextInput, Alert, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Expense, ExpenseCategory } from '@/lib/models';
import { expenseService } from '@/lib/services/expense.service';
import { Button, PriceInput, Card, StatCard } from '@/components/ui';

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: 'transporte', label: 'Transporte', emoji: '🚗' },
  { key: 'mercancia', label: 'Mercancía', emoji: '📦' },
  { key: 'servicios', label: 'Servicios', emoji: '⚡' },
  { key: 'alquiler', label: 'Alquiler', emoji: '🏠' },
  { key: 'empaque', label: 'Empaque', emoji: '🎁' },
  { key: 'otro', label: 'Otro', emoji: '📌' },
];

export default function ExpensesScreen() {
  const { state, refreshExpenses } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('otro');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'BS'>('USD');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const exchangeRate = state.exchangeRate;

  // Gastos de hoy
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = state.expenses.filter(e => {
    const expDate = new Date(e.createdAt).toISOString().split('T')[0];
    return expDate === today;
  });
  const todayTotal = todayExpenses.reduce((acc, e) => acc + e.amountUSD, 0);

  // Total general
  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amountUSD, 0);

  const handleAddExpense = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('Atención', 'Por favor, ingresa una descripción y un monto válido.');
      return;
    }

    const enteredAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (enteredAmount <= 0) {
      Alert.alert('Error', 'El monto debe ser un número mayor a cero.');
      return;
    }

    try {
      setLoading(true);
      const amountUSD = currency === 'USD' ? enteredAmount : enteredAmount / exchangeRate;
      const amountBS = currency === 'BS' ? enteredAmount : enteredAmount * exchangeRate;

      await expenseService.createExpense(
        description.trim(),
        category,
        amountUSD,
        amountBS,
        exchangeRate,
        'cash'
      );

      // Limpiar campos y cerrar formulario
      setDescription('');
      setAmount('');
      setShowForm(false);
      
      // Forzar actualización del estado global
      await refreshExpenses();
      
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {};
      }
      
      Alert.alert('Éxito', 'Gasto guardado y añadido al historial.');
    } catch (error) {
      console.error('Error al registrar gasto:', error);
      Alert.alert('Error', 'No se pudo guardar el gasto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert('Eliminar', '¿Eliminar este gasto?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await expenseService.deleteExpense(expense.id);
            await refreshExpenses();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el gasto');
          }
        },
      },
    ]);
  };

  const getCategoryInfo = (cat: ExpenseCategory) => {
    return CATEGORIES.find(c => c.key === cat) || CATEGORIES[5];
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const catInfo = getCategoryInfo(item.category);
    return (
      <Card 
        accentColor="#EF4444" 
        style={{ padding: 12, marginBottom: 8 }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center">
              <Text style={{ fontSize: 18 }}>{catInfo.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                {item.description}
              </Text>
              <Text className="text-[10px] text-muted">
                {catInfo.label} • {new Date(item.createdAt).toLocaleDateString('es-VE')}
              </Text>
            </View>
          </View>
          <View className="items-end mr-2">
            <Text className="text-base font-black text-red-500">
              -${item.amountUSD.toFixed(2)}
            </Text>
            <Text className="text-[10px] text-muted">
              {(item.amountUSD * item.exchangeRate).toFixed(2)} Bs
            </Text>
          </View>
          <Button 
            title="" 
            variant="outline" 
            icon="delete-outline" 
            iconColor="#EF4444"
            style={{ width: 36, height: 36, borderRadius: 18, padding: 0 }} 
            onPress={() => handleDeleteExpense(item)} 
          />
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-foreground tracking-tighter">Gastos</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Flujo de Caja</Text>
            </View>
            <View className="flex-row gap-2">
              <Button title="" variant={showForm ? "primary" : "outline"} icon={showForm ? "remove" : "add"} style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => setShowForm(!showForm)} />
              <Button title="" variant="outline" icon="close" style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => router.back()} />
            </View>
          </View>

          <View className="flex-row gap-4">
            <StatCard 
              label="Gastos Hoy" 
              value={`$${todayTotal.toFixed(2)}`} 
              subValue={`${(todayTotal * exchangeRate).toFixed(0)} Bs`}
              icon="trending-down" 
              color="#EF4444" 
            />
            <StatCard 
              label="Total Mes" 
              value={`$${totalExpenses.toFixed(2)}`} 
              icon="calendar-today" 
              color="#6366F1" 
            />
          </View>

          {state.dailySummary && (
            <View>
              <Card accentColor={(state.dailySummary.totalSales - todayTotal) >= 0 ? '#10B981' : '#EF4444'} variant="glass" style={{ padding: 0 }}>
                <View className="p-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Rentabilidad Neta Hoy</Text>
                    <MaterialIcons name="insights" size={16} color={colors.primary} />
                  </View>
                  <View className="flex-row items-baseline gap-2">
                    <Text className={`text-4xl font-black ${(state.dailySummary.totalSales - todayTotal) >= 0 ? 'text-emerald-500' : 'text-red-500'} tracking-tighter`}>
                      ${(state.dailySummary.totalSales - todayTotal).toFixed(2)}
                    </Text>
                    <Text className="text-lg font-bold text-muted">USD</Text>
                  </View>
                  
                  <View className="h-[1px] bg-border/10 my-4" />
                  
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-[10px] font-bold text-muted uppercase tracking-tighter">Ventas</Text>
                      <Text className="text-sm font-black text-foreground">${state.dailySummary.totalSales.toFixed(2)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] font-bold text-muted uppercase tracking-tighter">Egresos</Text>
                      <Text className="text-sm font-black text-red-500">-${todayTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {showForm && (
            <Card style={{ gap: 4 }} accentColor={colors.primary}>
              <View className="mb-2">
                <Text className="text-sm font-black text-foreground tracking-tight">Registrar Nuevo Gasto</Text>
                <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Complete los detalles del egreso</Text>
              </View>

              <PriceInput label="Descripción" value={description} onChangeText={setDescription} placeholder="Ej: Flete, bolsas, servicios..." />
              
              <View className="gap-2 mb-3">
                <Text className="text-[10px] font-black text-muted uppercase px-1">Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <Button key={cat.key} title={`${cat.emoji} ${cat.label}`} variant={category === cat.key ? 'primary' : 'outline'} style={{ height: 40, paddingHorizontal: 16, borderRadius: 12 }} textStyle={{ fontSize: 11, fontWeight: '900' }} onPress={() => setCategory(cat.key)} />
                  ))}
                </ScrollView>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <PriceInput label={`Monto (${currency})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
                <View className="flex-row bg-surface border border-border/40 rounded-xl p-1 h-[54] mt-[22]">
                  <Pressable onPress={() => setCurrency('USD')} className={`px-4 rounded-lg justify-center items-center ${currency === 'USD' ? 'bg-primary' : ''}`}><Text className={`text-xs font-black ${currency === 'USD' ? 'text-white' : 'text-muted'}`}>$</Text></Pressable>
                  <Pressable onPress={() => setCurrency('BS')} className={`px-4 rounded-lg justify-center items-center ${currency === 'BS' ? 'bg-primary' : ''}`}><Text className={`text-xs font-black ${currency === 'BS' ? 'text-white' : 'text-muted'}`}>BS</Text></Pressable>
                </View>
              </View>

              <Button title={loading ? "PROCESANDO..." : "GUARDAR GASTO"} variant="primary" icon="check-circle" onPress={handleAddExpense} disabled={loading} style={{ height: 56, marginTop: 10, borderRadius: 16 }} />
            </Card>
          )}

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Historial Reciente</Text>
              <View className="h-[1px] flex-1 bg-border/20 ml-4" />
            </View>

            {state.expenses.length > 0 ? (
              <View className="gap-1">
                {[...state.expenses].reverse().map(item => {
                  const catInfo = getCategoryInfo(item.category);
                  return (
                    <Card key={item.id} accentColor="#EF4444" style={{ padding: 0, marginBottom: 8 }}>
                      <View className="p-4 flex-row justify-between items-center">
                        <View className="flex-row items-center gap-4 flex-1">
                          <View className="w-12 h-12 rounded-2xl bg-red-500/10 items-center justify-center border border-red-500/10">
                            <Text style={{ fontSize: 20 }}>{catInfo.emoji}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-black text-foreground" numberOfLines={1}>{item.description}</Text>
                            <Text className="text-[10px] font-bold text-muted uppercase mt-0.5">{catInfo.label} • {new Date(item.createdAt).toLocaleDateString('es-VE')}</Text>
                          </View>
                        </View>
                        <View className="items-end mr-4">
                          <Text className="text-lg font-black text-red-500">-${item.amountUSD.toFixed(2)}</Text>
                          <Text className="text-[10px] font-bold text-muted">{(item.amountUSD * item.exchangeRate).toFixed(2)} Bs</Text>
                        </View>
                        <Button 
                          title="" 
                          variant="outline" 
                          icon="delete-outline" 
                          iconColor="#EF4444"
                          style={{ width: 40, height: 40, borderRadius: 12, padding: 0, borderColor: '#EF444420' }} 
                          onPress={() => handleDeleteExpense(item)} 
                        />
                      </View>
                    </Card>
                  );
                })}
              </View>
            ) : (
              <View className="items-center py-24 opacity-30">
                <View className="bg-muted/10 p-6 rounded-full mb-4">
                  <MaterialIcons name="receipt-long" size={64} color={colors.muted} />
                </View>
                <Text className="text-foreground text-lg font-black uppercase tracking-widest">Sin Gastos</Text>
                <Text className="text-muted font-bold text-center mt-2">No hay egresos registrados recientemente</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
