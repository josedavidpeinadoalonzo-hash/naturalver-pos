import { ScrollView, Text, View, Pressable, Image, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { configService } from '@/lib/services/config.service';
import { Button, PriceInput, Card } from '@/components/ui';

export default function ConfigScreen() {
  const { state, refreshConfig } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [name, setName] = useState(state.companyConfig?.name || '');
  const [rif, setRif] = useState(state.companyConfig?.rif || '');
  const [address, setAddress] = useState(state.companyConfig?.address || '');
  const [phone, setPhone] = useState(state.companyConfig?.phone || '');
  const [email, setEmail] = useState(state.companyConfig?.email || '');
  const [logoUri, setLogoUri] = useState(state.companyConfig?.logoUri || '');
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setLogoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim() || !rif.trim()) return Alert.alert('Error', 'Nombre y RIF obligatorios');
    try {
      setLoading(true);
      await configService.saveConfig({ name, rif, address, phone, email, logoUri });
      await refreshConfig();
      Alert.alert('Éxito', 'Configuración guardada');
    } catch (error) { Alert.alert('Error', 'No se pudo guardar'); } finally { setLoading(false); }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Configuración</Text>
            <Button title="" variant="outline" icon="close" style={{ width: 44, height: 44, borderRadius: 22 }} onPress={() => router.back()} />
          </View>

          <View className="items-center gap-3">
            <Pressable onPress={handlePickImage} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' }} className="items-center justify-center overflow-hidden">
              {logoUri ? <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} /> : <MaterialIcons name="add-a-photo" size={40} color={colors.primary} />}
            </Pressable>
            <Text className="text-[10px] text-muted font-black uppercase tracking-widest">Logo de la Empresa</Text>
          </View>

          <Card style={{ gap: 4 }}>
            <Text className="text-xs font-bold text-foreground uppercase mb-2">Datos Fiscales</Text>
            <PriceInput label="Nombre de la Empresa" value={name} onChangeText={setName} placeholder="Ej: NaturalVer's" />
            <PriceInput label="RIF / Identificación" value={rif} onChangeText={setRif} placeholder="Ej: J-12345678-9" />
            <PriceInput label="Dirección Fiscal" value={address} onChangeText={setAddress} multiline />
            <PriceInput label="Teléfono de Contacto" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <PriceInput label="Correo Electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
          </Card>

          <Button title={loading ? "GUARDANDO..." : "GUARDAR CAMBIOS"} variant="primary" style={{ paddingVertical: 16 }} onPress={handleSave} disabled={loading} />

          <View className="h-[1] bg-border my-2" />

          <View className="gap-3">
            <Text className="text-sm font-bold text-muted uppercase">Servicios y Marketing</Text>
            <Pressable onPress={() => router.push('/config/templates')}>
              <Card style={{ padding: 12 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="bg-green-500/10 p-3 rounded-xl"><MaterialIcons name="chat" size={24} color="#25D366" /></View>
                    <View>
                      <Text className="text-foreground font-bold">Plantillas de WhatsApp</Text>
                      <Text className="text-muted text-[10px]">Respuestas rápidas y marketing</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </View>
              </Card>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
