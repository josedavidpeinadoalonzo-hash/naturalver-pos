import { ScrollView, Text, View, Pressable, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Product, ProductPresentation } from '@/lib/models';
import { Button, PriceInput, Card } from '@/components/ui';

export default function EditProductScreen() {
  const { state, updateProduct, deleteProduct, addProduct } = useApp();
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isNewProduct = id === 'new';
  const product = !isNewProduct ? state.products.find(p => p.id === id) : null;

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [description, setDescription] = useState(product?.description || '');
  const [imageUri, setImageUri] = useState(product?.imageUri || '');
  const [presentations, setPresentations] = useState<ProductPresentation[]>(
    product?.presentations || [{ id: `p${Date.now()}`, name: '', priceUSD: 0, priceBs: 0, stock: 0 }]
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddPresentation = () => {
    const newId = `p${Date.now()}`;
    setPresentations([...presentations, { id: newId, name: '', priceUSD: 0, priceBs: 0, stock: 0 }]);
  };

  const handleUpdatePresentation = (presId: string, field: keyof ProductPresentation, value: any) => {
    setPresentations(prev => prev.map(p => p.id === presId ? { ...p, [field]: value } : p));
  };

  const handleRemovePresentation = (presId: string) => {
    if (presentations.length > 1) {
      setPresentations(prev => prev.filter(p => p.id !== presId));
    }
  };

  const validatePresentations = (): string | null => {
    for (const p of presentations) {
      if (!p.name.trim()) return `La variante "${p.name || '(sin nombre)'}" necesita un nombre de presentación`;
      const usd = parseFloat(p.priceUSD.toString().replace(',', '.'));
      if (isNaN(usd) || usd < 0) return `Precio USD inválido en "${p.name || 'variante'}"`;
      const bs = parseFloat(p.priceBs?.toString().replace(',', '.') || '0');
      if (isNaN(bs) || bs < 0) return `Precio Bs inválido en "${p.name || 'variante'}"`;
      const stock = parseInt(p.stock.toString());
      if (isNaN(stock) || stock < 0) return `Stock inválido en "${p.name || 'variante'}"`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!name.trim() || !category.trim()) {
      Alert.alert('Error', 'Nombre y categoría son obligatorios');
      return;
    }

    const validationError = validatePresentations();
    if (validationError) {
      Alert.alert('Error de validación', validationError);
      return;
    }

    try {
      setLoading(true);
      const processed = presentations.map(p => ({
        ...p,
        priceUSD: parseFloat(p.priceUSD.toString().replace(',', '.')) || 0,
        priceBs: parseFloat(p.priceBs?.toString().replace(',', '.') || '0') || 0,
        stock: parseInt(p.stock.toString()) || 0,
        lowStockThreshold: parseInt((p.lowStockThreshold || 5).toString()) || 5,
        wholesalePrice: p.wholesalePrice ? parseFloat(p.wholesalePrice.toString().replace(',', '.')) : undefined,
        resellerPrice: p.resellerPrice ? parseFloat(p.resellerPrice.toString().replace(',', '.')) : undefined,
      }));

      const data = { name, category, description, imageUri, presentations: processed };
      if (isNewProduct) await addProduct(data);
      else await updateProduct(product!.id, data);

      if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {} }
      Alert.alert('Éxito', 'Guardado correctamente');
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-foreground tracking-tight">{isNewProduct ? 'Nuevo Producto' : 'Editar Detalles'}</Text>
              <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Configuración de Inventario</Text>
            </View>
            <Button title="" variant="outline" icon="close" style={{ width: 44, height: 44, borderRadius: 16 }} onPress={() => router.back()} />
          </View>

          <View className="items-center">
            <Pressable 
              style={{ width: 140, height: 140, backgroundColor: colors.surface, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border }}
              className="items-center justify-center overflow-hidden shadow-sm"
              onPress={handlePickImage}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="items-center">
                  <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
                  <Text className="text-[10px] font-black text-primary mt-2 uppercase">Añadir Foto</Text>
                </View>
              )}
            </Pressable>
          </View>

          <Card style={{ gap: 4 }}>
            <Text className="text-[10px] font-black text-muted uppercase mb-2 tracking-widest">Información Básica</Text>
            <PriceInput label="Nombre del Producto" value={name} onChangeText={setName} placeholder="Ej: Jabón de Avena Premium" />
            <PriceInput label="Categoría" value={category} onChangeText={setCategory} placeholder="Ej: Cuidado Facial" />
            <PriceInput label="Descripción Corta" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 80 }} />
          </Card>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Presentaciones & Stock</Text>
              <Button title="AÑADIR" variant="outline" icon="add" fullWidth={false} style={{ height: 32, paddingHorizontal: 16, borderRadius: 16 }} textStyle={{ fontSize: 10 }} onPress={handleAddPresentation} />
            </View>

            {presentations.map((p, index) => (
              <Card key={p.id} accentColor={colors.primary} style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                <View className="flex-row justify-between items-center mb-3">
                  <View className="bg-primary/10 px-2 py-0.5 rounded">
                    <Text className="text-[9px] font-black text-primary uppercase">Variante # {index + 1}</Text>
                  </View>
                  {presentations.length > 1 && (
                    <Pressable onPress={() => handleRemovePresentation(p.id)} className="p-1">
                      <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
                
                <PriceInput label="Nombre de Presentación" value={p.name} onChangeText={v => handleUpdatePresentation(p.id, 'name', v)} placeholder="Ej: Unidad 100g" />
                
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <PriceInput label="Precio Detal ($)" currency="$" value={p.priceUSD.toString()} onChangeText={v => handleUpdatePresentation(p.id, 'priceUSD', v)} keyboardType="decimal-pad" />
                  </View>
                  <View className="flex-1">
                    <PriceInput label="Precio Detal (Bs)" currency="Bs" value={(p.priceBs || 0).toString()} onChangeText={v => handleUpdatePresentation(p.id, 'priceBs', v)} keyboardType="decimal-pad" />
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <PriceInput label="Stock Actual" value={p.stock.toString()} onChangeText={v => handleUpdatePresentation(p.id, 'stock', v)} keyboardType="numeric" />
                  </View>
                  <View className="flex-1">
                    <PriceInput label="Alerta Stock" value={(p.lowStockThreshold || 5).toString()} onChangeText={v => handleUpdatePresentation(p.id, 'lowStockThreshold', v)} keyboardType="numeric" />
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <PriceInput label="Precio Mayor" currency="$" value={(p.wholesalePrice || '').toString()} onChangeText={v => handleUpdatePresentation(p.id, 'wholesalePrice', v)} keyboardType="decimal-pad" />
                  </View>
                  <View className="flex-1">
                    <PriceInput label="Precio Reventa" currency="$" value={(p.resellerPrice || '').toString()} onChangeText={v => handleUpdatePresentation(p.id, 'resellerPrice', v)} keyboardType="decimal-pad" />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: colors.background, gap: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title={isNewProduct ? 'CREAR PRODUCTO' : 'GUARDAR CAMBIOS'} loading={loading} icon="save" onPress={handleSave} style={{ height: 56 }} />
        {!isNewProduct && (
          <Button 
            title="ELIMINAR DE INVENTARIO" 
            variant="outline" 
            icon="delete-sweep" 
            iconColor="#EF4444"
            onPress={() => Alert.alert('¿Eliminar Producto?', 'Esta acción no se puede deshacer y afectará el historial.', [{ text: 'Cancelar' }, { text: 'ELIMINAR', style: 'destructive', onPress: async () => { await deleteProduct(id as string); router.back(); } }])} 
            style={{ borderColor: '#EF444450', height: 44 }} 
            textStyle={{ color: '#EF4444', fontSize: 11 }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
