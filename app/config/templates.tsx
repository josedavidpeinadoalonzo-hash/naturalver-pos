import { ScrollView, Text, View, Pressable, Alert, Modal, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MessageTemplate } from '@/lib/models';
import * as Haptics from 'expo-haptics';
import { Button, PriceInput, Card } from '@/components/ui';

export default function TemplatesScreen() {
  const { state, addTemplate, updateTemplate, deleteTemplate, refreshTemplates } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MessageTemplate['category']>('other');
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (template?: MessageTemplate) => {
    if (template) {
      setEditingId(template.id); setTitle(template.title); setContent(template.content); setCategory(template.category);
    } else {
      setEditingId(null); setTitle(''); setContent(''); setCategory('other');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return Alert.alert('Error', 'Completa todos los campos');
    try {
      setLoading(true);
      if (editingId) {
        await updateTemplate(editingId, { title, content, category });
      } else {
        await addTemplate({ title, content, category });
      }
      setModalVisible(false);
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {};
      }
    } catch (error) { 
      Alert.alert('Error', 'No se pudo guardar'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Borrar esta plantilla?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, borrar', style: 'destructive', onPress: async () => { 
        await deleteTemplate(id); 
        if (Platform.OS !== 'web') {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {};
        }
      } }
    ]);
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="p-4 flex-row items-center justify-between border-b border-border">
        <View className="flex-row items-center gap-2">
          <Button title="" variant="outline" icon="arrow-back" style={{ width: 40, height: 40, borderRadius: 20 }} onPress={() => router.back()} />
          <Text className="text-xl font-bold text-foreground">Plantillas WhatsApp</Text>
        </View>
        <Button title="" variant="primary" icon="add" style={{ width: 40, height: 40, borderRadius: 20 }} onPress={() => handleOpenModal()} />
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {state.templates.length === 0 ? (
          <View className="items-center justify-center py-20 opacity-40">
            <MaterialIcons name="chat-bubble-outline" size={64} color={colors.muted} />
            <Text className="text-muted mt-4 font-bold">Sin plantillas</Text>
          </View>
        ) : (
          state.templates.map((template) => (
            <Card key={template.id} style={{ marginBottom: 12, padding: 12 }} accentColor={template.category === 'payment' ? '#4CAF50' : template.category === 'location' ? '#2196F3' : '#FF9800'}>
              <View className="flex-row justify-between items-start">
                <Pressable className="flex-1" onPress={() => handleOpenModal(template)}>
                  <Text className="text-foreground font-black uppercase text-xs mb-1">{template.title}</Text>
                  <Text className="text-muted text-sm" numberOfLines={2}>{template.content}</Text>
                </Pressable>
                <Button title="" variant="outline" icon="delete-outline" style={{ width: 32, height: 32, borderColor: colors.error + '20' }} iconColor={colors.error} onPress={() => handleDelete(template.id)} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-background rounded-t-[32px] p-6 h-[85%] border-t border-border">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-foreground">{editingId ? 'EDITAR' : 'NUEVA'} PLANTILLA</Text>
              <Button title="" variant="outline" icon="close" style={{ width: 40, height: 40, borderRadius: 20 }} onPress={() => setModalVisible(false)} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
              <PriceInput label="Título de la Plantilla" value={title} onChangeText={setTitle} placeholder="Ej: Datos de Pago" />
              
              <View className="gap-2">
                <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Categoría</Text>
                <View className="flex-row gap-2">
                  {(['payment', 'location', 'greeting', 'other'] as const).map((cat) => (
                    <Button key={cat} title={cat === 'payment' ? 'PAGO' : cat === 'location' ? 'MAPA' : cat === 'greeting' ? 'HOLA' : 'OTRO'} variant={category === cat ? 'primary' : 'outline'} style={{ flex: 1, height: 36 }} textStyle={{ fontSize: 10 }} onPress={() => setCategory(cat)} />
                  ))}
                </View>
              </View>

              <PriceInput label="Mensaje de WhatsApp" value={content} onChangeText={setContent} placeholder="Escribe tu mensaje aquí..." multiline style={{ minHeight: 180, textAlignVertical: 'top' }} />
              
              <Card style={{ backgroundColor: colors.primary + '05', borderColor: colors.primary + '20' }}>
                <Text className="text-[10px] text-primary font-bold italic">💡 Tip: Usa [CORCHETES] para marcar datos variables que completarás al enviar.</Text>
              </Card>
            </ScrollView>

            <Button title={loading ? "GUARDANDO..." : "GUARDAR PLANTILLA"} variant="primary" style={{ marginTop: 20, paddingVertical: 16 }} onPress={handleSave} disabled={loading} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
