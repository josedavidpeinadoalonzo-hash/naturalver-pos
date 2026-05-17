import React from 'react';
import { Modal, View, Text, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/lib/context/app-context';
import { useColors } from '@/hooks/use-colors';
import { Button, Card } from './ui';
import { MessageTemplate } from '@/lib/models';

interface TemplatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: MessageTemplate) => void;
  category?: MessageTemplate['category'];
}

export function TemplatePickerModal({ visible, onClose, onSelect, category }: TemplatePickerModalProps) {
  const { state } = useApp();
  const colors = useColors();

  const filteredTemplates = category 
    ? state.templates.filter(t => t.category === category)
    : state.templates;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-[32px] p-6 h-[70%] border-t border-border">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-xl font-black text-foreground">SELECCIONAR PLANTILLA</Text>
              <Text className="text-[10px] font-bold text-muted uppercase">WhatsApp Marketing</Text>
            </View>
            <Button title="" variant="outline" icon="close" style={{ width: 40, height: 40, borderRadius: 20 }} onPress={onClose} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            {filteredTemplates.length === 0 ? (
              <View className="items-center py-20 opacity-30">
                <MaterialIcons name="chat-bubble-outline" size={48} color={colors.muted} />
                <Text className="text-muted font-bold mt-2">No hay plantillas disponibles</Text>
              </View>
            ) : (
              filteredTemplates.map((template) => (
                <Pressable key={template.id} onPress={() => { onSelect(template); onClose(); }}>
                  <Card style={{ padding: 16 }} accentColor={template.category === 'payment' ? '#4CAF50' : template.category === 'location' ? '#2196F3' : '#FF9800'}>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1 mr-4">
                        <Text className="text-foreground font-black text-xs uppercase mb-1">{template.title}</Text>
                        <Text className="text-muted text-sm" numberOfLines={2}>{template.content}</Text>
                      </View>
                      <MaterialIcons name="send" size={20} color={colors.primary} />
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
