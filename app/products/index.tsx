import { ScrollView, Text, View, Pressable, FlatList, TextInput, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Product } from '@/lib/models';
import { Card, Button } from '@/components/ui';

export default function ProductsScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(state.products.map(p => p.category)));
  const filteredProducts = state.products.filter(p => (p.name.toLowerCase().includes(searchQuery.toLowerCase())) && (!selectedCategory || p.category === selectedCategory));

  const renderProductCard = ({ item }: { item: Product }) => {
    const totalStock = item.presentations.reduce((acc, p) => acc + p.stock, 0);
    const hasOutOfStock = item.presentations.some(p => p.stock === 0);
    const hasLowStock = item.presentations.some(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
    const stockStatus = hasOutOfStock ? 'AGOTADO' : hasLowStock ? 'STOCK BAJO' : 'DISPONIBLE';
    const stockColor = hasOutOfStock ? '#EF4444' : hasLowStock ? '#F59E0B' : '#10B981';

    return (
      <Card 
        accentColor={stockColor} 
        style={{ marginBottom: 12, padding: 12 }}
        onPress={() => router.push(`../products/${item.id}`)}
      >
        <View className="flex-row gap-4">
          <View style={{ width: 70, height: 70, backgroundColor: colors.background, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <MaterialIcons name="inventory" size={28} color={colors.muted} />
            )}
            <View className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5">
              <Text className="text-[7px] text-white font-black text-center uppercase">Ref: {item.id.slice(-4)}</Text>
            </View>
          </View>

          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-base font-black text-foreground mb-0.5" numberOfLines={1}>{item.name}</Text>
                <View className="flex-row items-center gap-1.5">
                  <View className="bg-primary/10 px-1.5 py-0.5 rounded">
                    <Text className="text-[8px] font-bold text-primary uppercase">{item.category}</Text>
                  </View>
                  <Text className="text-[8px] font-bold text-muted uppercase">Stock: {totalStock}</Text>
                </View>
              </View>
              <View className="bg-background rounded-full px-2 py-0.5 border border-border" style={{ borderColor: stockColor + '40' }}>
                <Text className="text-[8px] font-black" style={{ color: stockColor }}>{stockStatus}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-border my-2 w-full" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row gap-2">
                {item.presentations.slice(0, 2).map(p => (
                  <View key={p.id} className="items-start">
                    <Text className="text-[8px] text-muted font-bold uppercase">{p.name || 'Única'}</Text>
                    <Text className="text-xs font-black text-emerald-600">${p.priceUSD.toFixed(2)}</Text>
                  </View>
                ))}
                {item.presentations.length > 2 && (
                  <View className="justify-center">
                    <Text className="text-[8px] text-muted font-bold italic">+{item.presentations.length - 2} más</Text>
                  </View>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.border} />
            </View>
          </View>
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
              <Text className="text-3xl font-black text-foreground tracking-tighter">Inventario</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{state.products.length} PRODUCTOS REGISTRADOS</Text>
            </View>
            <View className="flex-row gap-2">
              <Button title="" variant="primary" icon="add" style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => router.push('../products/new')} />
              <Button title="" variant="outline" icon="close" style={{ width: 48, height: 48, borderRadius: 16 }} onPress={() => router.back()} />
            </View>
          </View>

          <View className="bg-surface border border-border/40 rounded-[20px] px-4 h-14 flex-row items-center shadow-sm">
            <MaterialIcons name="search" size={22} color={colors.muted} />
            <TextInput 
              placeholder="Buscar por nombre o categoría..." 
              placeholderTextColor={colors.muted} 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
              className="flex-1 ml-3 text-foreground font-semibold text-base"
            />
          </View>

          {categories.length > 0 && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3 pr-5">
                  <Button 
                    title="Todas" 
                    variant={selectedCategory === null ? 'primary' : 'secondary'} 
                    style={{ paddingHorizontal: 20, height: 40, borderRadius: 20 }} 
                    textStyle={{ fontSize: 11, fontWeight: '900' }}
                    onPress={() => setSelectedCategory(null)} 
                  />
                  {categories.map(cat => (
                    <Button 
                      key={cat} 
                      title={cat} 
                      variant={selectedCategory === cat ? 'primary' : 'secondary'} 
                      style={{ paddingHorizontal: 20, height: 40, borderRadius: 20 }} 
                      textStyle={{ fontSize: 11, fontWeight: '900' }}
                      onPress={() => setSelectedCategory(cat)} 
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View className="gap-2">
            {filteredProducts.map(item => {
              const totalStock = item.presentations.reduce((acc, p) => acc + p.stock, 0);
              const hasOutOfStock = item.presentations.some(p => p.stock === 0);
              const hasLowStock = item.presentations.some(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
              const stockStatus = hasOutOfStock ? 'AGOTADO' : hasLowStock ? 'STOCK BAJO' : 'DISPONIBLE';
              const stockColor = hasOutOfStock ? '#EF4444' : hasLowStock ? '#F59E0B' : '#10B981';

              return (
                <Card 
                  key={item.id}
                  accentColor={stockColor} 
                  style={{ marginBottom: 4, padding: 0 }}
                  onPress={() => router.push(`../products/${item.id}`)}
                >
                  <View className="flex-row items-center">
                    <View className="w-16 h-16 bg-background rounded-2xl items-center justify-center overflow-hidden border border-border/20">
                      {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <MaterialIcons name="eco" size={28} color={colors.primary} style={{ opacity: 0.3 }} />
                      )}
                    </View>

                    <View className="flex-1 ml-4">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-base font-black text-foreground tracking-tight" numberOfLines={1}>{item.name}</Text>
                        <View className="bg-background rounded-full px-2.5 py-1 border border-border/40">
                          <Text className="text-[8px] font-black tracking-tighter" style={{ color: stockColor }}>{stockStatus}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1">
                          <MaterialIcons name="layers" size={10} color={colors.muted} />
                          <Text className="text-[10px] font-bold text-muted uppercase">{item.category}</Text>
                        </View>
                        <View className="w-1 h-1 bg-muted/40 rounded-full" />
                        <Text className="text-[10px] font-black text-foreground">Stock: {totalStock}</Text>
                      </View>
                    </View>

                    <MaterialIcons name="chevron-right" size={24} color={colors.border} className="ml-2" />
                  </View>

                  <View className="h-[1px] bg-border/5 my-4" />

                  <View className="flex-row gap-4">
                    {item.presentations.map(p => (
                      <View key={p.id} className="bg-primary/5 px-3 py-2 rounded-xl border border-primary/5">
                        <Text className="text-[9px] text-muted font-bold uppercase mb-0.5">{p.name}</Text>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm font-black text-emerald-600">${p.priceUSD.toFixed(2)}</Text>
                          {p.priceBs > 0 && <Text className="text-[10px] text-muted font-bold">({p.priceBs} Bs)</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}

            {filteredProducts.length === 0 && (
              <View className="items-center py-24 opacity-30">
                <View className="bg-muted/10 p-6 rounded-full mb-4">
                  <MaterialIcons name="inventory-2" size={64} color={colors.muted} />
                </View>
                <Text className="text-foreground text-lg font-black uppercase tracking-widest">Sin resultados</Text>
                <Text className="text-muted font-bold text-center mt-2">Intenta con otra búsqueda o categoría</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
