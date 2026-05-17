import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-background p-6">
          <View className="bg-red-500/10 p-6 rounded-full mb-6">
            <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          </View>
          <Text className="text-xl font-black text-foreground mb-2">Algo salió mal</Text>
          <Text className="text-sm text-muted text-center mb-6 font-medium">
            {this.state.error?.message || 'Ocurrió un error inesperado'}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="bg-primary px-8 py-4 rounded-xl"
          >
            <Text className="text-white font-black text-sm uppercase">Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
